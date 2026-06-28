"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isValidDropStartedAt,
  resolveImminentLiveRemainingSeconds,
} from "@/lib/experience/imminent-live-countdown";
import { GOING_LIVE_TRANSITION_SEC } from "@/lib/experience/live-go-live-transition";

const FADE_OUT_MS = 500;

type UseDropCurtainCountdownOptions = {
  dropStartedAt: string | null;
  durationSeconds?: number;
  onComplete: () => void;
};

/**
 * Server-anchored drop-curtain ticker — recomputes from dropStartedAt each tick.
 * Handles mobile tab backgrounding via visibilitychange resync.
 */
export function useDropCurtainCountdown({
  dropStartedAt,
  durationSeconds = GOING_LIVE_TRANSITION_SEC,
  onComplete,
}: UseDropCurtainCountdownOptions) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    dropStartedAt && isValidDropStartedAt(dropStartedAt)
      ? resolveImminentLiveRemainingSeconds(dropStartedAt, durationSeconds)
      : durationSeconds,
  );
  const [isFadingOut, setIsFadingOut] = useState(false);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const finishCountdown = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsFadingOut(true);
    window.setTimeout(() => {
      onCompleteRef.current();
    }, FADE_OUT_MS);
  }, []);

  useEffect(() => {
    completedRef.current = false;
    setIsFadingOut(false);

    if (!isValidDropStartedAt(dropStartedAt)) {
      finishCountdown();
      return;
    }

    const tick = () => {
      const remaining = resolveImminentLiveRemainingSeconds(dropStartedAt, durationSeconds);
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        finishCountdown();
      }
    };

    let animationFrameId = 0;
    let lastSecond = -1;

    const animate = () => {
      const remaining = resolveImminentLiveRemainingSeconds(dropStartedAt, durationSeconds);
      if (remaining !== lastSecond) {
        lastSecond = remaining;
        setRemainingSeconds(remaining);
      }
      if (remaining <= 0) {
        finishCountdown();
        return;
      }
      animationFrameId = window.requestAnimationFrame(animate);
    };

    tick();
    animationFrameId = window.requestAnimationFrame(animate);

    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [dropStartedAt, durationSeconds, finishCountdown]);

  const isComplete = remainingSeconds <= 0 || completedRef.current;

  return { remainingSeconds, isComplete, isFadingOut };
}
