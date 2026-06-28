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

function fallbackLabel(kind: "videoinput" | "audioinput", index: number): string {
  if (kind === "videoinput") {
    return index === 0 ? "Default camera" : `Camera ${index + 1}`;
  }
  return index === 0 ? "Default microphone" : `Microphone ${index + 1}`;
}

export default function InAppDeviceCaptureSelectors({
  disabled = false,
  onSelectionChange,
}: InAppDeviceCaptureSelectorsProps) {
  const [videoDevices, setVideoDevices] = useState<MediaDeviceOption[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceOption[]>([]);
  const [videoDeviceId, setVideoDeviceId] = useState("");
  const [audioDeviceId, setAudioDeviceId] = useState("");
  const [detectMessage, setDetectMessage] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);

  const refreshDevices = useCallback(async (requestPermission = false) => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      setDetectMessage("Device enumeration is not supported in this browser.");
      return;
    }

    if (requestPermission) {
      setDetecting(true);
      try {
        const probe = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        probe.getTracks().forEach((track) => track.stop());
      } catch (error) {
        setDetectMessage(
          error instanceof Error ? error.message : "Camera/microphone permission denied.",
        );
        setDetecting(false);
        return;
      }
      setDetecting(false);
    }

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

    const nextVideo = videoDeviceId && videos.some((d) => d.deviceId === videoDeviceId)
      ? videoDeviceId
      : videos[0]?.deviceId ?? "";
    const nextAudio = audioDeviceId && audios.some((d) => d.deviceId === audioDeviceId)
      ? audioDeviceId
      : audios[0]?.deviceId ?? "";

    setVideoDeviceId(nextVideo);
    setAudioDeviceId(nextAudio);
    setDetectMessage(
      videos.length || audios.length
        ? "Hardware detected — select video and audio inputs below."
        : "No capture devices found. Connect a webcam or USB capture card.",
    );
  }, [audioDeviceId, videoDeviceId]);

  useEffect(() => {
    void refreshDevices(false);
  }, [refreshDevices]);

  useEffect(() => {
    if (!videoDeviceId && !audioDeviceId) return;
    onSelectionChange?.({ videoDeviceId, audioDeviceId });
  }, [audioDeviceId, onSelectionChange, videoDeviceId]);

  return (
    <div className="space-y-4">
      <button
        type="button"
        disabled={disabled || detecting}
        onClick={() => void refreshDevices(true)}
        className="min-h-10 rounded-full border border-slate-700 px-4 font-ui text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-300 disabled:opacity-40"
      >
        {detecting ? "Detecting…" : "Detect Cameras & Microphones"}
      </button>

      {detectMessage ? (
        <p className="font-body text-xs text-slate-400">{detectMessage}</p>
      ) : null}

      <label className="block">
        <span className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-slate-500">
          Video input
        </span>
        <select
          disabled={disabled || videoDevices.length === 0}
          value={videoDeviceId}
          onChange={(event) => setVideoDeviceId(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 font-body text-sm text-slate-100"
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
        <span className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-slate-500">
          Audio input
        </span>
        <select
          disabled={disabled || audioDevices.length === 0}
          value={audioDeviceId}
          onChange={(event) => setAudioDeviceId(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 font-body text-sm text-slate-100"
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
