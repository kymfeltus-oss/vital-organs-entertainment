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
    <div className="mt-4 flex w-full max-w-sm items-center gap-3 rounded-xl border border-brand-border/70 bg-black/45 p-2.5 text-left sm:mt-5">
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
        <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.16em] text-brand-blue">
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
    <div className="experience-stream-stage relative w-full overflow-hidden rounded-none min-h-[min(72vw,22rem)] sm:min-h-[min(58vw,24rem)] md:aspect-video md:min-h-0 md:rounded-xl">
      <div className="pointer-events-none absolute inset-0 z-0">
        {countdownConfig.hero_background_url ? (
          <Image
            src={countdownConfig.hero_background_url}
            alt=""
            fill
            className="object-cover opacity-35"
            sizes="(max-width: 768px) 100vw, 65vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-panel via-brand-black to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/60 to-black/92" />
      </div>

      <div className="relative z-[2] flex min-h-[inherit] flex-col items-center justify-center px-4 py-5 text-center sm:px-8 sm:py-6">
        <div className="relative mx-auto h-[clamp(5.25rem,28vw,8.5rem)] w-[clamp(5.25rem,28vw,8.5rem)] shrink-0">
          <div
            className="pointer-events-none absolute -inset-3 rounded-full bg-brand-blue/20 blur-2xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -inset-1 rounded-full bg-brand-pink/10 blur-xl"
            aria-hidden="true"
          />
          <Image
            src={EXPERIENCE_BRAND_ASSETS.emblem}
            alt="300 Awakening"
            fill
            priority
            sizes="(max-width: 768px) 28vw, 136px"
            className="object-contain"
          />
        </div>

        {countdownConfig.eyebrow ? (
          <p className="mt-4 font-ui text-[0.56rem] font-bold uppercase tracking-[0.26em] text-brand-blue sm:mt-5">
            {countdownConfig.eyebrow}
          </p>
        ) : (
          <p className="mt-4 font-ui text-[0.56rem] font-bold uppercase tracking-[0.26em] text-brand-blue sm:mt-5">
            Vital Organs Entertainment
          </p>
        )}

        {countdownConfig.headline ? (
          <h2 className="mt-2 font-headline text-xl uppercase tracking-[0.14em] text-white sm:text-2xl md:text-3xl">
            {countdownConfig.headline}
          </h2>
        ) : (
          <h2 className="mt-2 font-headline text-xl uppercase tracking-[0.14em] text-white sm:text-2xl">
            300 Awakening
          </h2>
        )}

        {countdownConfig.subtitle ? (
          <p className="mt-2 max-w-lg font-body text-sm leading-relaxed text-zinc-300 sm:text-base">
            {countdownConfig.subtitle}
          </p>
        ) : null}

        <div className="experience-glass-chip mt-4 inline-flex items-center rounded-full px-4 py-2">
          <span className="font-ui text-[0.56rem] font-bold uppercase tracking-[0.14em] text-zinc-300">
            {statusText}
          </span>
        </div>

        {showCountdownTimer || countdownLoading ? (
          <div className="mt-5 w-full max-w-lg px-1 sm:mt-6">
            <ExperienceCountdown
              countdown={countdown}
              statusLabel={countdownConfig.status_label}
              isLoading={countdownLoading}
              showTimer={showCountdownTimer}
            />
          </div>
        ) : null}

        {countdownConfig.helper_text ? (
          <p className="mt-3 max-w-md font-body text-xs leading-relaxed text-zinc-400 sm:text-sm">
            {countdownConfig.helper_text}
          </p>
        ) : (
          <p className="mt-3 max-w-md font-body text-xs leading-relaxed text-zinc-400 sm:text-sm">
            Fellowship Chat is open — the live stream begins when we go live.
          </p>
        )}

        <WaitingRoomMusicPromo />
      </div>
    </div>
  );
}
