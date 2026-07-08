"use client";

import { useCallback, useEffect, useRef } from "react";

import { getColemanMicEngineStarter } from "@/app/enterprise/coleman/lib/audio/preload-mic-engine";
import type { MicPitchFrame } from "@/app/enterprise/coleman/lib/audio/coleman-mic-engine.types";

export type WebAudioPitchTrackerOptions = {
  onFrame: (frame: MicPitchFrame) => void;
  onError?: (message: string) => void;
};

const UI_EMIT_INTERVAL_MS = 50;

type MicEngineStarter = (
  options: import("@/app/enterprise/coleman/lib/audio/coleman-mic-engine.types").MicEngineOptions,
) => () => void;

function shouldEmitUiFrame(prev: MicPitchFrame | null, next: MicPitchFrame, elapsedMs: number): boolean {
  if (!prev) {
    return true;
  }
  if (prev.currentKey !== next.currentKey) {
    return true;
  }
  if (prev.isStable !== next.isStable) {
    return true;
  }
  if (Math.abs(prev.currentCents - next.currentCents) >= 6) {
    return true;
  }
  return elapsedMs >= UI_EMIT_INTERVAL_MS;
}

export function useWebAudioPitchTracker(options: WebAudioPitchTrackerOptions) {
  const stopRef = useRef<(() => void) | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const lastUiFrameRef = useRef<MicPitchFrame | null>(null);
  const lastUiEmitAtRef = useRef(0);
  const micEngineStarterRef = useRef<MicEngineStarter | null>(null);

  const killWebAudioTracking = useCallback(() => {
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }
    lastUiFrameRef.current = null;
    lastUiEmitAtRef.current = 0;
  }, []);

  const startLiveWebAudioTracking = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    killWebAudioTracking();

    void (async () => {
      try {
        if (!micEngineStarterRef.current) {
          micEngineStarterRef.current = await getColemanMicEngineStarter();
        }

        stopRef.current = micEngineStarterRef.current({
          onFrame: (frame) => {
            const now = performance.now();
            const elapsed = now - lastUiEmitAtRef.current;

            if (!shouldEmitUiFrame(lastUiFrameRef.current, frame, elapsed)) {
              return;
            }

            lastUiEmitAtRef.current = now;
            lastUiFrameRef.current = frame;
            optionsRef.current.onFrame(frame);
          },
          onError: (message) => {
            optionsRef.current.onError?.(message);
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        optionsRef.current.onError?.(message);
      }
    })();
  }, [killWebAudioTracking]);

  useEffect(() => {
    return () => {
      killWebAudioTracking();
    };
  }, [killWebAudioTracking]);

  return {
    startLiveWebAudioTracking,
    killWebAudioTracking,
  };
}
