"use client";

import { useEffect, useRef, useState } from "react";
import type { AudioChannel } from "@/lib/broadcast/types";

/** Map local mic dB (-60…0, or -Infinity when silent) to 0–100 mixer meter scale. */
export function localMicDbToMeterLevel(db: number): number {
  if (!Number.isFinite(db)) return 0;
  const clamped = Math.max(-60, Math.min(0, db));
  return Math.min(100, Math.round(((clamped + 60) / 54) * 100));
}

/**
 * Capture local camera + microphone for internal-studio dashboard testing.
 * Optionally streams microphone volume as dB telemetry for the audio mixer.
 */
export function useLocalWebcam(
  isEnabled: boolean,
  onAudioLevelUpdate?: (levelDb: number) => void,
): MediaStream | null {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onAudioLevelUpdateRef = useRef(onAudioLevelUpdate);

  useEffect(() => {
    onAudioLevelUpdateRef.current = onAudioLevelUpdate;
  }, [onAudioLevelUpdate]);

  useEffect(() => {
    if (!isEnabled) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
      onAudioLevelUpdateRef.current?.(-Infinity);
      return;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      onAudioLevelUpdateRef.current?.(-Infinity);
      return;
    }

    let cancelled = false;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let animationFrameId: number | null = null;

    void navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        if (cancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = mediaStream;
        setStream(mediaStream);

        if (onAudioLevelUpdateRef.current) {
          const AudioContextCtor =
            window.AudioContext ||
            (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

          if (AudioContextCtor) {
            audioContext = new AudioContextCtor();
            const source = audioContext.createMediaStreamSource(mediaStream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateVolume = () => {
              if (cancelled || !analyser) return;

              analyser.getByteFrequencyData(dataArray);
              const sum = dataArray.reduce((accumulator, value) => accumulator + value, 0);
              const average = dataArray.length > 0 ? sum / dataArray.length : 0;
              const calculatedDb =
                average === 0 ? -Infinity : (average / 255) * 60 - 60;

              onAudioLevelUpdateRef.current?.(calculatedDb);
              animationFrameId = window.requestAnimationFrame(updateVolume);
            };

            updateVolume();
          }
        }
      })
      .catch((err: unknown) => {
        console.error("Local hardware testing camera access denied", err);
        onAudioLevelUpdateRef.current?.(-Infinity);
      });

    return () => {
      cancelled = true;
      if (animationFrameId != null) window.cancelAnimationFrame(animationFrameId);
      void audioContext?.close();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      onAudioLevelUpdateRef.current?.(-Infinity);
    };
  }, [isEnabled]);

  return stream;
}

/** Merge live webcam meter into CAM 1 for the digital audio mixer UI. */
export function applyLocalWebcamToAudioChannels(
  channels: AudioChannel[],
  meterLevel: number,
): AudioChannel[] {
  if (meterLevel <= 4) return channels;

  const cam1Index = channels.findIndex((channel) =>
    /cam\s*1|camera guy|restream pull/i.test(channel.name),
  );

  if (cam1Index >= 0) {
    return channels.map((channel, index) =>
      index === cam1Index
        ? {
            ...channel,
            meterLevel: Math.max(channel.meterLevel, meterLevel),
            clipping: channel.clipping || meterLevel > 92,
          }
        : channel,
    );
  }

  return [
    {
      id: "local-webcam-cam1",
      name: "Cam 1: Camera Guy",
      volume: 100,
      muted: false,
      meterLevel,
      clipping: meterLevel > 92,
      autoGain: false,
    },
    ...channels,
  ];
}
