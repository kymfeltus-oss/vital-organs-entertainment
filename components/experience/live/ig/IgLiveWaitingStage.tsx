"use client";

import Image from "next/image";
import ExperienceCountdown from "@/components/experience/live/ExperienceCountdown";
import { EXPERIENCE_BRAND_ASSETS } from "@/lib/experience/brand-assets";
import { COUNTDOWN_STARTING_SHORTLY_LABEL, shouldShowCountdownTimer } from "@/lib/experience/countdown-display";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { CountdownParts } from "@/lib/live/event-lobby";

export type IgLiveWaitingState = {
  countdown: CountdownParts;
  countdownConfig: EventCountdownConfig;
  countdownLoading: boolean;
};

type IgLiveWaitingStageProps = IgLiveWaitingState;

export default function IgLiveWaitingStage({
  countdown,
  countdownConfig,
  countdownLoading,
}: IgLiveWaitingStageProps) {
  const showCountdownTimer = shouldShowCountdownTimer(countdownConfig, countdownLoading);

  const statusText = countdown.isComplete
    ? COUNTDOWN_STARTING_SHORTLY_LABEL
    : countdownConfig.status_label || "Waiting for live signal";

  return (
    <div className="ig-live-waiting-stage absolute inset-0 z-[1] flex flex-col items-center justify-center overflow-hidden bg-brand-black px-4 py-8 text-center">
      {countdownConfig.hero_background_url ? (
        <div className="pointer-events-none absolute inset-0 z-0">
          <Image
            src={countdownConfig.hero_background_url}
            alt=""
            fill
            className="object-cover opacity-30"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/80 to-black" />
        </div>
      ) : null}

      <div className="relative z-[1] flex max-w-md flex-col items-center">
        <div className="relative h-[clamp(4.5rem,22vw,7rem)] w-[clamp(4.5rem,22vw,7rem)] shrink-0">
          <div
            className="experience-emblem-glow-blue pointer-events-none absolute -inset-4 rounded-full blur-2xl"
            aria-hidden="true"
          />
          <Image
            src={EXPERIENCE_BRAND_ASSETS.lockup}
            alt="Awakening"
            fill
            priority
            sizes="(max-width: 768px) 22vw, 112px"
            className="object-contain"
          />
        </div>

        <p className="mt-4 font-ui text-[0.54rem] font-bold uppercase tracking-[0.24em] text-brand-blue">
          {countdownConfig.eyebrow || "Vital Organs Entertainment"}
        </p>

        <h2 className="mt-1 font-headline text-xl uppercase tracking-[0.14em] text-white sm:text-2xl">
          {countdownConfig.headline || "300 Awakening"}
        </h2>

        <div className="experience-glass-chip mt-4 inline-flex items-center rounded-full px-4 py-1.5">
          <span className="font-ui text-[0.54rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
            {statusText}
          </span>
        </div>

        {showCountdownTimer || countdownLoading ? (
          <div className="mt-5 w-full min-w-0 px-1">
            <ExperienceCountdown
              countdown={countdown}
              isLoading={countdownLoading}
              showTimer={showCountdownTimer}
            />
          </div>
        ) : null}

        <p className="mt-4 max-w-sm font-body text-xs leading-relaxed text-brand-muted">
          {countdownConfig.helper_text ||
            "Fellowship Chat is open — the live stream begins when we go live."}
        </p>
      </div>
    </div>
  );
}
