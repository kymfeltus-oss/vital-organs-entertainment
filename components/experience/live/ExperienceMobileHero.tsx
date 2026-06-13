"use client";

import Image from "next/image";
import { EXPERIENCE_BRAND_ASSETS } from "@/lib/experience/brand-assets";
import type { CountdownParts } from "@/lib/live/event-lobby";
import ExperienceCountdown from "@/components/experience/live/ExperienceCountdown";

type ExperienceMobileHeroProps = {
  streamIsLive: boolean;
  isStreamStateLoading: boolean;
  statusLabel: string;
  heroBackgroundUrl?: string | null;
  countdown?: CountdownParts;
  countdownLoading?: boolean;
  showCountdownTimer?: boolean;
};

export default function ExperienceMobileHero({
  streamIsLive,
  isStreamStateLoading,
  statusLabel,
  heroBackgroundUrl,
  countdown,
  countdownLoading = false,
  showCountdownTimer = false,
}: ExperienceMobileHeroProps) {
  const pillText = isStreamStateLoading
    ? "Syncing live signal…"
    : streamIsLive
      ? "Live signal active"
      : statusLabel;

  return (
    <section className="relative w-full shrink-0 overflow-hidden border-b border-white/[0.06] bg-[#0B090A] px-4 py-5 pt-safe">
      {heroBackgroundUrl ? (
        <div className="pointer-events-none absolute inset-0 z-0">
          <Image
            src={heroBackgroundUrl}
            alt=""
            fill
            className="object-cover opacity-35"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B090A]/30 via-[#0B090A]/80 to-[#0B090A]" />
        </div>
      ) : (
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-80"
          style={{
            background:
              "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(30,64,175,0.35) 0%, rgba(176,38,122,0.12) 45%, #0B090A 75%)",
          }}
          aria-hidden="true"
        />
      )}

      <div className="relative z-[1] flex flex-col items-center text-center">
        <div className="relative h-[clamp(4.5rem,28vw,6.5rem)] w-[clamp(4.5rem,28vw,6.5rem)] shrink-0">
          <Image
            src={EXPERIENCE_BRAND_ASSETS.emblem}
            alt="300 Awakening"
            fill
            priority
            sizes="(max-width: 768px) 28vw, 104px"
            className="object-contain"
          />
        </div>

        <h2 className="mt-3 font-ui text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#1E40AF]">
          Live Recording Experience
        </h2>

        <div className="experience-glass-chip mt-3 inline-flex items-center rounded-full px-3 py-1">
          <span
            className={`font-ui text-[0.54rem] font-bold uppercase tracking-[0.14em] ${
              streamIsLive ? "text-[#B0267A]" : "text-zinc-300"
            }`}
          >
            {streamIsLive ? "✦ " : ""}
            {pillText}
          </span>
        </div>

        {countdown && (showCountdownTimer || countdownLoading) ? (
          <div className="mt-4 w-full max-w-sm min-w-0 px-1">
            <ExperienceCountdown
              countdown={countdown}
              statusLabel={statusLabel}
              isLoading={countdownLoading}
              showTimer={showCountdownTimer}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
