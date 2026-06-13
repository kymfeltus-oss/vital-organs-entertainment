"use client";

import Image from "next/image";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { CountdownParts } from "@/lib/live/event-lobby";
import { shouldShowCountdownTimer } from "@/lib/experience/countdown-display";
import ExperienceCountdown from "@/components/experience/live/ExperienceCountdown";

type WaitingRoomProps = {
  countdown: CountdownParts;
  countdownConfig: EventCountdownConfig;
  countdownLoading: boolean;
};

export default function WaitingRoom({
  countdown,
  countdownConfig,
  countdownLoading,
}: WaitingRoomProps) {
  const showCountdownTimer = shouldShowCountdownTimer(countdownConfig, countdownLoading);

  const statusText = countdown.isComplete
    ? countdownConfig.status_label || "Event starts soon"
    : countdownConfig.status_label || "Waiting for live signal";

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-none border border-brand-border bg-brand-panel md:rounded-xl">
      <div className="pointer-events-none absolute inset-0">
        {countdownConfig.hero_background_url ? (
          <Image
            src={countdownConfig.hero_background_url}
            alt=""
            fill
            className="object-cover opacity-30"
            sizes="(max-width: 768px) 100vw, 70vw"
            priority
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-black/30 via-brand-black/80 to-brand-black" />
      </div>

      <div className="relative flex h-full flex-col justify-end p-4 sm:p-6 md:p-8">
        {countdownConfig.eyebrow ? (
          <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.24em] text-brand-blue">
            {countdownConfig.eyebrow}
          </p>
        ) : null}

        {countdownConfig.headline ? (
          <p
            className={`font-headline text-xl uppercase tracking-[0.14em] text-white sm:text-2xl md:text-3xl ${
              countdownConfig.eyebrow ? "mt-3" : ""
            }`}
          >
            {countdownConfig.headline}
          </p>
        ) : null}

        {countdownConfig.subtitle ? (
          <p className="mt-2 max-w-xl font-body text-sm leading-relaxed text-brand-muted sm:text-base">
            {countdownConfig.subtitle}
          </p>
        ) : null}

        <div className="mt-4 inline-flex w-fit items-center rounded-full border border-brand-border bg-black/60 px-4 py-2">
          <span className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
            {statusText}
          </span>
        </div>

        {showCountdownTimer || countdownLoading ? (
          <div className="mt-6 max-w-lg">
            <ExperienceCountdown
              countdown={countdown}
              statusLabel={countdownConfig.status_label}
              isLoading={countdownLoading}
              showTimer={showCountdownTimer}
            />
          </div>
        ) : null}

        <p className="mt-4 max-w-lg font-body text-xs text-brand-muted sm:text-sm">
          {countdownConfig.helper_text}
        </p>
      </div>
    </div>
  );
}
