"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  GOING_LIVE_TRANSITION_MS,
  GOING_LIVE_TRANSITION_SEC,
} from "@/lib/experience/live-go-live-transition";
import {
  MOBILE_ARTBOARD_TAB_SHELL,
  MOBILE_ARTBOARD_TAB_STAGE,
  mobileArtboardStageStyle,
} from "@/lib/responsive";

type GoingLiveTransitionProps = {
  visible: boolean;
  durationMs?: number;
};

export default function GoingLiveTransition({
  visible,
  durationMs = GOING_LIVE_TRANSITION_MS,
}: GoingLiveTransitionProps) {
  const [secondsLeft, setSecondsLeft] = useState(GOING_LIVE_TRANSITION_SEC);

  useEffect(() => {
    if (!visible) return;

    const endAt = Date.now() + durationMs;
    const tick = () => {
      setSecondsLeft(Math.max(1, Math.ceil((endAt - Date.now()) / 1_000)));
    };

    tick();
    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [durationMs, visible]);

  if (!visible) return null;

  return (
    <main className="live-holding-shell experience-go-live-root">
      <div className={`experience-go-live-page ${MOBILE_ARTBOARD_TAB_SHELL}`}>
        <div
          className={`experience-go-live-page__stage ${MOBILE_ARTBOARD_TAB_STAGE}`}
          style={mobileArtboardStageStyle() as CSSProperties}
        >
          <div
            className="experience-go-live-overlay"
            role="status"
            aria-live="polite"
            aria-label={`Opening live experience in ${secondsLeft} seconds`}
          >
            <div className="experience-go-live-sweep" aria-hidden="true" />

            <div className="relative rounded-full border border-brand-pink/50 bg-brand-pink/10 px-6 py-2">
              <p className="font-ui text-[0.72rem] font-bold uppercase tracking-[0.24em] text-brand-pink">
                Live Now
              </p>
            </div>

            <p
              className="experience-go-live-countdown relative mt-8 font-headline tabular-nums leading-none tracking-[0.08em] text-brand-blue"
              aria-hidden="true"
            >
              {secondsLeft}
            </p>

            <p className="relative mt-6 font-headline text-[clamp(1.35rem,5.5cqw,2rem)] uppercase tracking-[0.16em] text-white">
              Opening Live Experience…
            </p>
            <p className="relative mt-2 px-4 font-body text-[clamp(0.72rem,2.8cqw,0.875rem)] text-brand-muted">
              300 Awakening Live Experience · entering in {secondsLeft}s
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
