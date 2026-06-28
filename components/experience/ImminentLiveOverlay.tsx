"use client";

import { useDropCurtainCountdown } from "@/hooks/useDropCurtainCountdown";
import { GOING_LIVE_TRANSITION_SEC } from "@/lib/experience/live-go-live-transition";

const OVERLAY_BACKDROP = "#07070A";
const BRAND_PURPLE_NEON = "#8A2EFF";
const BRAND_BLUE_ACCENT = "#00A8FF";

const SUBTITLE =
  "THE SANCTUARY SEATS ARE FILLED. THE CHOIR IS IN POSITION. PREPARE FOR THE ANOINTING. BROADCAST INITIALIZING...";

type ImminentLiveOverlayProps = {
  /** Server-emitted UTC anchor — required for stateless countdown sync. */
  dropStartedAt: string;
  onCountdownComplete: () => void;
  durationSeconds?: number;
};

export default function ImminentLiveOverlay({
  dropStartedAt,
  onCountdownComplete,
  durationSeconds = GOING_LIVE_TRANSITION_SEC,
}: ImminentLiveOverlayProps) {
  const { remainingSeconds, isFadingOut } = useDropCurtainCountdown({
    dropStartedAt,
    durationSeconds,
    onComplete: onCountdownComplete,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-live="assertive"
      aria-label={`Broadcast initializing in ${remainingSeconds} seconds`}
      className="fixed inset-0 z-[200] flex items-center justify-center transition-opacity duration-500"
      style={{
        backgroundColor: OVERLAY_BACKDROP,
        opacity: isFadingOut ? 0 : 1,
        pointerEvents: isFadingOut ? "none" : "auto",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 45%, rgba(138,46,255,0.22) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex max-w-4xl flex-col items-center px-6 text-center">
        <p
          className="font-headline tabular-nums leading-none tracking-tight"
          style={{
            color: BRAND_PURPLE_NEON,
            fontSize: "clamp(5.5rem, 22vw, 11rem)",
            textShadow: `
              0 0 24px rgba(138, 46, 255, 0.95),
              0 0 64px rgba(138, 46, 255, 0.75),
              0 0 120px rgba(138, 46, 255, 0.45)
            `,
          }}
        >
          {remainingSeconds}
        </p>

        <p
          className="mt-8 max-w-3xl font-ui text-[0.62rem] font-bold uppercase leading-relaxed tracking-[0.28em] sm:text-[0.68rem] sm:tracking-[0.32em]"
          style={{ color: BRAND_BLUE_ACCENT }}
        >
          {SUBTITLE}
        </p>
      </div>
    </div>
  );
}
