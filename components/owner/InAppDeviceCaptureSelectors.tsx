"use client";

import { useCallback, useEffect, useState } from "react";

export type MediaDeviceOption = {
  deviceId: string;
  label: string;
};

export type SelectedCaptureDevices = {
  videoDeviceId: string;
  audioDeviceId: string;
};

type InAppDeviceCaptureSelectorsProps = {
  disabled?: boolean;
  onSelectionChange?: (selection: SelectedCaptureDevices) => void;
};

type DetectStatus = "idle" | "pending" | "success" | "warning" | "error";

const DEVICE_PERMISSION_TIMEOUT_MS = 15_000;

function fallbackLabel(kind: "videoinput" | "audioinput", index: number): string {
  if (kind === "videoinput") {
    return index === 0 ? "Default camera" : `Camera ${index + 1}`;
  }
  return index === 0 ? "Default microphone" : `Microphone ${index + 1}`;
}

function isSecureCaptureContext(): boolean {
  if (typeof window === "undefined") return false;
  return window.isSecureContext || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

function stopProbeStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}

function getCaptureErrorMessage(error: unknown): string {
  if (!(error instanceof DOMException) && !(error instanceof Error)) {
    return "Camera and microphone detection failed.";
  }

  if (error.name === "NotAllowedError" || error.name === "SecurityError") {
    return "Camera or microphone permission was blocked. Allow access in the browser permission prompt, then run detection again.";
  }
  if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
    return "No camera or microphone was found. Connect a device, then run detection again.";
  }
  if (error.name === "NotReadableError" || error.name === "TrackStartError") {
    return "The camera or microphone is already in use by another app. Close that app, then run detection again.";
  }
  if (error.name === "OverconstrainedError") {
    return "The selected capture constraints are not supported by the connected device.";
  }
  if (error.name === "AbortError") {
    return "The browser stopped the capture request before it completed.";
  }

  return error.message || "Camera and microphone detection failed.";
}

async function requestCapturePermission(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser does not support camera and microphone capture.");
  }

  return await Promise.race([
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }),
    new Promise<MediaStream>((_, reject) => {
      window.setTimeout(
        () => reject(new Error("Camera/microphone permission request timed out. Check the browser permission prompt.")),
        DEVICE_PERMISSION_TIMEOUT_MS,
      );
    }),
  ]);
}

export default function InAppDeviceCaptureSelectors({
  disabled = false,
  onSelectionChange,
}: InAppDeviceCaptureSelectorsProps) {
  const [videoDevices, setVideoDevices] = useState<MediaDeviceOption[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceOption[]>([]);
  const [videoDeviceId, setVideoDeviceId] = useState("");
  const [audioDeviceId, setAudioDeviceId] = useState("");
  const [detectMessage, setDetectMessage] = useState<string | null>(
    "Click Detect Cameras & Microphones to request browser permission and load production inputs.",
  );
  const [detectStatus, setDetectStatus] = useState<DetectStatus>("idle");
  const [lastScanLabel, setLastScanLabel] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);

  const refreshDevices = useCallback(async (requestPermission = false) => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      setDetectStatus("error");
      setDetectMessage("Device enumeration is not supported in this browser.");
      return;
    }

    if (!isSecureCaptureContext()) {
      setDetectStatus("error");
      setDetectMessage("Camera and microphone detection requires HTTPS or localhost.");
      return;
    }

    setDetectStatus(requestPermission ? "pending" : "idle");
    setDetectMessage(
      requestPermission
        ? "Requesting camera and microphone permission. Approve the browser prompt to continue."
        : "Checking for previously authorized capture devices.",
    );
    setDetecting(requestPermission);

    if (requestPermission) {
      try {
        const probe = await requestCapturePermission();
        stopProbeStream(probe);
      } catch (error) {
        setDetectStatus("error");
        setDetectMessage(getCaptureErrorMessage(error));
        setDetecting(false);
        return;
      }
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videos = devices
        .filter((device) => device.kind === "videoinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || fallbackLabel("videoinput", index),
        }));
      const audios = devices
        .filter((device) => device.kind === "audioinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || fallbackLabel("audioinput", index),
        }));

      setVideoDevices(videos);
      setAudioDevices(audios);

      const nextVideo = videoDeviceId && videos.some((device) => device.deviceId === videoDeviceId)
        ? videoDeviceId
        : videos[0]?.deviceId ?? "";
      const nextAudio = audioDeviceId && audios.some((device) => device.deviceId === audioDeviceId)
        ? audioDeviceId
        : audios[0]?.deviceId ?? "";

      setVideoDeviceId(nextVideo);
      setAudioDeviceId(nextAudio);
      setLastScanLabel(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

      if (videos.length > 0 && audios.length > 0) {
        setDetectStatus("success");
        setDetectMessage(`Detected ${videos.length} camera input${videos.length === 1 ? "" : "s"} and ${audios.length} microphone input${audios.length === 1 ? "" : "s"}.`);
      } else if (videos.length > 0 || audios.length > 0) {
        setDetectStatus("warning");
        setDetectMessage(`Partial detection: ${videos.length} camera input${videos.length === 1 ? "" : "s"} and ${audios.length} microphone input${audios.length === 1 ? "" : "s"} found.`);
      } else {
        setDetectStatus("warning");
        setDetectMessage("No capture devices found. Connect a webcam, microphone, or USB capture card, then run detection again.");
      }
    } catch (error) {
      setDetectStatus("error");
      setDetectMessage(getCaptureErrorMessage(error));
    } finally {
      setDetecting(false);
    }
  }, [audioDeviceId, videoDeviceId]);

  useEffect(() => {
    queueMicrotask(() => void refreshDevices(false));
  }, [refreshDevices]);

  useEffect(() => {
    if (!videoDeviceId && !audioDeviceId) return;
    onSelectionChange?.({ videoDeviceId, audioDeviceId });
  }, [audioDeviceId, onSelectionChange, videoDeviceId]);

  const statusClass =
    detectStatus === "success"
      ? "border-[#22E66B]/45 bg-[#071F13] text-[#22E66B]"
      : detectStatus === "warning"
        ? "border-amber-400/50 bg-amber-950/20 text-amber-100"
        : detectStatus === "error"
          ? "border-red-400/50 bg-red-950/20 text-red-200"
          : detectStatus === "pending"
            ? "border-[#00A7FF]/50 bg-[#06162A] text-[#8EDBFF]"
            : "border-[#263A61] bg-[#071022] text-white/58";

  return (
    <div className="space-y-4">
      <button
        data-testid="owner-control-detect-camera-microphone-button"
        type="button"
        disabled={disabled || detecting}
        onClick={() => void refreshDevices(true)}
        className="min-h-11 rounded-[7px] border border-[#00A7FF] px-5 font-ui text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#00DDEB] shadow-[0_0_16px_rgba(0,167,255,0.18)] disabled:opacity-40"
      >
        {detecting ? "Requesting Permission..." : "Detect Cameras & Microphones"}
      </button>

      <div
        data-testid="owner-control-device-detection-status"
        role={detectStatus === "error" ? "alert" : "status"}
        className={`rounded-[7px] border px-3 py-2 font-body text-sm ${statusClass}`}
      >
        <p>{detectMessage}</p>
        {lastScanLabel ? (
          <p className="mt-1 text-[0.68rem] uppercase tracking-[0.12em] text-white/45">
            Last scan: {lastScanLabel}
          </p>
        ) : null}
      </div>

      <label className="block">
        <span className="font-ui text-xs font-bold uppercase tracking-[0.18em] text-white/62">
          Video input
        </span>
        <select
          data-testid="owner-control-video-input-select"
          disabled={disabled || videoDevices.length === 0}
          value={videoDeviceId}
          onChange={(event) => setVideoDeviceId(event.target.value)}
          className="mt-2 min-h-12 w-full rounded-[7px] border border-[#263A61] bg-[#070A16] px-4 font-body text-sm text-white outline-none disabled:opacity-45"
        >
          {videoDevices.length === 0 ? (
            <option value="">No video devices</option>
          ) : (
            videoDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))
          )}
        </select>
      </label>

      <label className="block">
        <span className="font-ui text-xs font-bold uppercase tracking-[0.18em] text-white/62">
          Audio input
        </span>
        <select
          data-testid="owner-control-audio-input-select"
          disabled={disabled || audioDevices.length === 0}
          value={audioDeviceId}
          onChange={(event) => setAudioDeviceId(event.target.value)}
          className="mt-2 min-h-12 w-full rounded-[7px] border border-[#263A61] bg-[#070A16] px-4 font-body text-sm text-white outline-none disabled:opacity-45"
        >
          {audioDevices.length === 0 ? (
            <option value="">No audio devices</option>
          ) : (
            audioDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))
          )}
        </select>
      </label>
    </div>
  );
}
