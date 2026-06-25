from __future__ import annotations

import os
import shutil
import time
from typing import Any


class EncoderService:
    def __init__(self) -> None:
        self._sessions: dict[str, dict[str, Any]] = {}
        self._last_heartbeat = 0.0

    def heartbeat(self) -> None:
        self._last_heartbeat = time.time()

    def health(self) -> dict[str, Any]:
        vmix = bool(os.getenv("VMIX_API_BASE_URL", "").strip())
        obs = bool(os.getenv("OBS_WEBSOCKET_URL", "").strip())
        online = vmix or obs or (self._last_heartbeat > 0 and (time.time() - self._last_heartbeat) < 120)
        active = sum(1 for s in self._sessions.values() if s.get("started_at") and not s.get("stopped_at"))
        if vmix:
            message = "Local encoder ready (vMix)."
        elif obs:
            message = "Local encoder ready (OBS WebSocket)."
        elif online:
            message = "Local streaming agent online."
        else:
            message = "No local encoder configured. Set VMIX_API_BASE_URL or OBS_WEBSOCKET_URL."
        return {"online": online, "message": message, "activeSessions": active}

    def _call_vmix(self, fn: str) -> bool:
        vmix_url = os.getenv("VMIX_API_BASE_URL", "").strip()
        if not vmix_url:
            return False
        import httpx

        response = httpx.get(f"{vmix_url}?Function={fn}", timeout=8.0)
        return response.status_code < 400

    def prepare(self, destination_id: str, stream_url: str | None, stream_key: str | None) -> dict[str, Any]:
        self.heartbeat()
        if not stream_url and not stream_key:
            return {"success": False, "message": "Stream server URL and stream key are required."}

        vmix = bool(os.getenv("VMIX_API_BASE_URL", "").strip())
        obs = bool(os.getenv("OBS_WEBSOCKET_URL", "").strip())
        if not vmix and not obs:
            return {
                "success": False,
                "message": "No local encoder is configured. Connect vMix or OBS WebSocket on this production machine.",
            }

        self._sessions[destination_id] = {
            "destination_id": destination_id,
            "stream_url": stream_url,
            "stream_key": stream_key,
            "prepared_at": time.time(),
            "started_at": None,
            "stopped_at": None,
        }
        return {"success": True, "message": "Encoder prepared for streaming."}

    def start(self, destination_id: str, stream_url: str | None, stream_key: str | None) -> dict[str, Any]:
        self.heartbeat()
        session = self._sessions.get(destination_id)
        if not session:
            prepared = self.prepare(destination_id, stream_url, stream_key)
            if not prepared.get("success"):
                return prepared
            session = self._sessions[destination_id]

        if self._call_vmix("StartStreaming"):
            session["started_at"] = time.time()
            session["stopped_at"] = None
            return {"success": True, "message": "vMix streaming started."}

        return {
            "success": False,
            "message": "Could not start local encoder. Verify vMix is running and VMIX_API_BASE_URL is correct.",
        }

    def stop(self) -> dict[str, Any]:
        self.heartbeat()
        stopped = False
        if self._call_vmix("StopStreaming"):
            stopped = True
        if self._call_vmix("StopRecording"):
            stopped = True

        now = time.time()
        for session in self._sessions.values():
            if session.get("started_at") and not session.get("stopped_at"):
                session["stopped_at"] = now

        if stopped:
            return {"success": True, "message": "Local encoder stopped."}
        if self._sessions:
            return {"success": False, "message": "Could not reach local encoder to stop streaming."}
        return {"success": False, "message": "No active encoder session to stop."}

    def preview_stats(self, destination_id: str) -> dict[str, Any]:
        self.heartbeat()
        session = self._sessions.get(destination_id) or {}
        vmix_url = os.getenv("VMIX_API_BASE_URL", "").strip()
        dropped_frames = 0
        current_bitrate_kbps = 0
        current_fps = 0.0
        network_mbps = 0.0

        if vmix_url:
            import httpx

            try:
                response = httpx.get(vmix_url, timeout=6.0)
                if response.status_code < 400 and "<streaming>" in response.text.lower():
                    text = response.text
                    if "bitrate" in text.lower():
                        for token in text.replace(">", " ").replace("<", " ").split():
                            if token.replace(".", "", 1).isdigit() and float(token) > 100:
                                current_bitrate_kbps = max(current_bitrate_kbps, int(float(token)))
                    current_fps = 30.0
                    network_mbps = round(current_bitrate_kbps / 1000, 2) if current_bitrate_kbps else 0.0
            except Exception:
                pass

        cpu_percent = 0.0
        gpu_percent = 0.0
        try:
            import psutil

            cpu_percent = float(psutil.cpu_percent(interval=0.2))
        except Exception:
            pass

        if shutil.which("nvidia-smi"):
            try:
                import subprocess

                out = subprocess.check_output(
                    ["nvidia-smi", "--query-gpu=utilization.gpu", "--format=csv,noheader,nounits"],
                    text=True,
                    timeout=4.0,
                )
                gpu_percent = float(out.strip().splitlines()[0])
            except Exception:
                pass

        online = bool(vmix_url) or bool(session.get("prepared_at"))
        return {
            "online": online,
            "message": "Encoder preview active." if online else "Prepare the encoder to view live stats.",
            "droppedFrames": dropped_frames,
            "currentBitrateKbps": current_bitrate_kbps,
            "currentFps": current_fps,
            "encoderUsagePercent": min(100.0, cpu_percent + gpu_percent * 0.5),
            "gpuUsagePercent": gpu_percent,
            "cpuUsagePercent": cpu_percent,
            "networkThroughputMbps": network_mbps,
            "audioLevels": {"left": 0.0, "right": 0.0},
        }


encoder_service = EncoderService()
