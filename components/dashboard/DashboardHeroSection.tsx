"use client";

import Image from "next/image";
import Link from "next/link";
import LobbyCountdownTimer from "@/components/lobby/LobbyCountdownTimer";
import type { CountdownParts } from "@/lib/live/event-lobby";
import type { EventCountdownConfig, EventCountdownPhase } from "@/lib/live/countdown-config";

export type DashboardHeroSectionProps = {
  config: EventCountdownConfig;
  countdown: CountdownParts;
  eventPhase: EventCountdownPhase;
  showLiveSignal: boolean;
  showTimer: boolean;
  ctaLabel: string;
  ctaHref?: string;
  ctaDisabled: boolean;
};

export default function DashboardHeroSection({
  config,
  countdown,
  eventPhase,
  showLiveSignal,
  showTimer,
  ctaLabel,
  ctaHref,
  ctaDisabled,
}: DashboardHeroSectionProps) {
  const pillSrc = showLiveSignal ? "/ui/live-pill.png" : config.waiting_pill_url;
  const pillAlt = showLiveSignal ? "Live signal" : config.status_label;

  return (
    <section className="relative h-[475px] shrink-0 overflow-hidden rounded-[24px] border border-[#1E40AF]/55 bg-[#050406] shadow-[0_0_70px_rgba(30,64,175,0.2),inset_0_0_80px_rgba(0,0,0,0.65)]">
      <Image
        src={config.hero_background_url}
        alt=""
        fill
        priority
        className="object-cover object-center opacity-100"
        sizes="(max-width: 1280px) 100vw, 55vw"
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/5 to-black/45" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_30%_45%,rgba(30,64,175,0.32),transparent_36%),radial-gradient(circle_at_72%_43%,rgba(176,38,122,0.35),transparent_36%)]" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 opacity-75">
        <Image
          src="/effects/waveform-overlay.png"
          alt=""
          fill
          className="object-cover object-bottom"
          sizes="100vw"
        />
      </div>

      <div className="relative z-10 flex h-full flex-col items-center pt-[26px] text-center">
        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.52em] text-[#93C5FD]">
          {config.eyebrow}
        </p>

        <h1
          className="mb-[14px] font-black uppercase leading-[0.95] tracking-[0.18em] text-white"
          style={{
            fontSize: "clamp(54px, 4.35vw, 76px)",
            textShadow:
              "0 0 18px rgba(255,255,255,0.18), 0 0 34px rgba(176,38,122,0.18)",
          }}
        >
          {config.headline}
        </h1>

        <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.36em] text-white">
          {config.subtitle}
        </p>

        <div className="relative mb-2 flex w-full justify-center">
          <LobbyCountdownTimer
            config={config}
            countdown={countdown}
            eventPhase={eventPhase}
            showTimer={showTimer}
            variant="hms"
          />
        </div>

        {eventPhase === "waiting" && (
          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#D4D4D8]">
            {config.status_label}
          </p>
        )}

        {eventPhase === "ended" && (
          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#D4D4D8]">
            Experience Ended
          </p>
        )}

        <div className="relative mt-1 h-[42px] w-full max-w-[300px]">
          <Image src={pillSrc} alt={pillAlt} fill className="object-contain" />
        </div>

        <div className="relative mt-3 h-[78px] w-full max-w-[540px]">
          <Image src={config.button_frame_url} alt="" fill className="object-contain" />
          <div className="absolute inset-0 flex items-center justify-center">
            {ctaHref && !ctaDisabled ? (
              <Link
                href={ctaHref}
                className="text-2xl font-black uppercase tracking-[0.28em] text-white hover:text-[#D4D4D8]"
              >
                {ctaLabel}
              </Link>
            ) : (
              <span
                className={`text-2xl font-black uppercase tracking-[0.28em] ${
                  ctaDisabled ? "text-[#D4D4D8]" : "text-white"
                }`}
              >
                {ctaLabel}
              </span>
            )}
          </div>
        </div>

        <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#D4D4D8]">
          {config.helper_text}
        </p>
      </div>
    </section>
  );
}
