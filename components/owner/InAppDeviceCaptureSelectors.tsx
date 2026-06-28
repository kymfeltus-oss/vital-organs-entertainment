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
        ? "Hardware detected - select video and audio inputs below."
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
        data-testid="owner-control-detect-camera-microphone-button"
        type="button"
        disabled={disabled || detecting}
        onClick={() => void refreshDevices(true)}
        className="min-h-11 rounded-[7px] border border-[#00A7FF] px-5 font-ui text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#00DDEB] shadow-[0_0_16px_rgba(0,167,255,0.18)] disabled:opacity-40"
      >
        {detecting ? "Detecting..." : "Detect Cameras & Microphones"}
      </button>

      {detectMessage ? (
        <p className="font-body text-sm text-white/58">{detectMessage}</p>
      ) : null}

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
