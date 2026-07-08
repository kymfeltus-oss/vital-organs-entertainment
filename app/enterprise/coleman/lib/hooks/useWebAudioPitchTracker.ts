"use client";

import { useCallback, useEffect, useRef } from "react";

import { startColemanMicEngine } from "@/app/enterprise/coleman/lib/audio/coleman-mic-engine";
import type { MicPitchFrame } from "@/app/enterprise/coleman/lib/audio/coleman-mic-engine.types";

export type WebAudioPitchTrackerOptions = {
  onFrame: (frame: MicPitchFrame) => void;
  onError?: (message: string) => void;
};

export function useWebAudioPitchTracker(options: WebAudioPitchTrackerOptions) {
  const stopRef = useRef<(() => void) | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const killWebAudioTracking = useCallback(() => {
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }
  }, []);

  const startLiveWebAudioTracking = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    killWebAudioTracking();

    stopRef.current = startColemanMicEngine({
      onFrame: (frame) => {
        optionsRef.current.onFrame(frame);
      },
      onError: (message) => {
        optionsRef.current.onError?.(message);
      },
    });
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
