"use client";

import Image from "next/image";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { CountdownParts } from "@/lib/live/event-lobby";
import { EXPERIENCE_BRAND_ASSETS } from "@/lib/experience/brand-assets";
import { shouldShowCountdownTimer } from "@/lib/experience/countdown-display";
import ExperienceCountdown from "@/components/experience/live/ExperienceCountdown";

type WaitingRoomProps = {
  countdown: CountdownParts;
  countdownConfig: EventCountdownConfig;
  countdownLoading: boolean;
};

function WaitingRoomMusicPromo() {
  return (
    <div className="mt-4 hidden w-full max-w-sm items-center gap-3 rounded-xl border border-white/8 bg-[#111111]/80 p-2.5 text-left md:flex">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg sm:h-16 sm:w-16">
        <Image
          src={EXPERIENCE_BRAND_ASSETS.hallelujahCover}
          alt="Hallelujah Anyhow single artwork"
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0">
        <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.16em] exp-text-blue">
          Featured Music
        </p>
        <p className="mt-1 font-card-title text-sm uppercase tracking-[0.06em] text-white">
          Hallelujah Anyhow
        </p>
        <p className="mt-0.5 font-body text-xs text-zinc-400">Available now on all platforms</p>
      </div>
    </div>
  );
}

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
    <div className="experience-live-stage-fit experience-stream-stage experience-waiting-hero relative w-full min-w-0 overflow-hidden rounded-none min-h-[min(68vw,20rem)] sm:min-h-[min(58vw,22rem)] md:aspect-video md:min-h-0 md:rounded-xl">
      {countdownConfig.hero_background_url ? (
        <div className="pointer-events-none absolute inset-0 z-0">
          <Image
            src={countdownConfig.hero_background_url}
            alt=""
            fill
            className="object-cover opacity-25"
            sizes="(max-width: 768px) 100vw, 65vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B090A]/40 via-[#0B090A]/75 to-[#0B090A]" />
        </div>
      ) : null}

      <div className="relative z-[2] flex min-h-[inherit] flex-col items-center justify-center px-3 py-4 text-center sm:px-6 sm:py-5">
        <div className="relative mx-auto h-[clamp(5.5rem,32vw,9rem)] w-[clamp(5.5rem,32vw,9rem)] shrink-0">
          <div
            className="experience-emblem-glow-blue pointer-events-none absolute -inset-4 rounded-full blur-2xl"
            aria-hidden="true"
          />
          <div
            className="experience-emblem-glow-magenta pointer-events-none absolute -inset-2 rounded-full blur-xl"
            aria-hidden="true"
          />
          <Image
            src={EXPERIENCE_BRAND_ASSETS.emblem}
            alt="300 Awakening"
            fill
            priority
            sizes="(max-width: 768px) 32vw, 144px"
            className="object-contain"
          />
        </div>

        <p className="mt-3 font-ui text-[0.54rem] font-bold uppercase tracking-[0.24em] exp-text-blue sm:mt-4">
          {countdownConfig.eyebrow || "Vital Organs Entertainment"}
        </p>

        <h2 className="mt-1 hidden font-headline text-xl uppercase tracking-[0.14em] text-white sm:block sm:text-2xl">
          {countdownConfig.headline || "300 Awakening"}
        </h2>

        {countdownConfig.subtitle ? (
          <p className="mt-2 hidden max-w-lg font-body text-sm leading-relaxed text-zinc-300 sm:block">
            {countdownConfig.subtitle}
          </p>
        ) : null}

        <div className="experience-glass-chip mt-3 inline-flex items-center rounded-full px-4 py-1.5 sm:mt-4">
          <span className="font-ui text-[0.54rem] font-bold uppercase tracking-[0.14em] text-zinc-300">
            {statusText}
          </span>
        </div>

        {showCountdownTimer || countdownLoading ? (
          <div className="mt-4 w-full max-w-lg min-w-0 px-1 sm:mt-5">
            <ExperienceCountdown
              countdown={countdown}
              statusLabel={countdownConfig.status_label}
              isLoading={countdownLoading}
              showTimer={showCountdownTimer}
            />
          </div>
        ) : null}

        <p className="mt-2 max-w-md font-body text-[0.7rem] leading-relaxed text-zinc-400 sm:text-xs">
          {countdownConfig.helper_text ||
            "Fellowship Chat is open — the live stream begins when we go live."}
        </p>

        <WaitingRoomMusicPromo />
      </div>
    </div>
  );
}
