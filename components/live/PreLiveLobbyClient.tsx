"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Lock, Radio, Sparkles } from "lucide-react";
import { deriveEventLifecycleStatus } from "@/lib/live/event-lifecycle";
import {
  computeCountdown,
  EVENT_LOBBY,
  type AccessStatus,
  type CountdownParts,
  type EventStatus,
} from "@/lib/live/event-lobby";
import { useLiveStreamState } from "@/lib/useLiveStreamState";

const PreLiveLobbySidePanels = dynamic(
  () => import("@/components/live/PreLiveLobbySidePanels"),
  { ssr: false },
);

const PreLiveLobbyStatCards = dynamic(
  () => import("@/components/live/PreLiveLobbyStatCards"),
  { ssr: false },
);

function useEventCountdown(targetIso: string): CountdownParts {
  const [parts, setParts] = useState<CountdownParts>(() => computeCountdown(targetIso));

  useEffect(() => {
    const tick = () => setParts(computeCountdown(targetIso));
    tick();
    const intervalId = setInterval(tick, 1_000);
    return () => clearInterval(intervalId);
  }, [targetIso]);

  return parts;
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[4.5rem] flex-col items-center rounded-2xl border border-white/10 bg-[#111111]/80 px-3 py-4 backdrop-blur-md md:min-w-[5.5rem] md:px-4">
      <span className="text-2xl font-bold tabular-nums text-white md:text-4xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-2 text-[0.58rem] font-bold uppercase tracking-[0.22em] text-zinc-500">
        {label}
      </span>
    </div>
  );
}

function WaveformAccentCss() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 flex h-24 items-end justify-center gap-1 opacity-40 md:h-32"
    >
      {Array.from({ length: 28 }).map((_, index) => (
        <span
          key={index}
          className="live-waveform-bar w-1 rounded-full bg-gradient-to-t from-[#1E40AF] to-[#B0267A]"
          style={{ animationDelay: `${index * 0.06}s` }}
        />
      ))}
    </div>
  );
}

type PreLiveLobbyClientProps = {
  accessStatus: AccessStatus;
  onEnterLive: () => void;
};

export default function PreLiveLobbyClient({
  accessStatus,
  onEnterLive,
}: PreLiveLobbyClientProps) {
  const [showSidePanels, setShowSidePanels] = useState(false);
  const countdown = useEventCountdown(EVENT_LOBBY.targetIso);
  const { isLive: streamIsLive, isLoading: isStreamStateLoading } = useLiveStreamState();

  const eventStatus: EventStatus = useMemo(
    () =>
      deriveEventLifecycleStatus({
        streamIsLive,
        isStreamStateLoading,
      }),
    [isStreamStateLoading, streamIsLive],
  );

  useEffect(() => {
    const frameId = requestAnimationFrame(() => setShowSidePanels(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  const isLocked = accessStatus === "locked";
  const isLive = eventStatus === "live";
  const isEnded = eventStatus === "ended";

  const heroHeading = useMemo(() => {
    if (isLocked) return "UNLOCK THE AWAKENING";
    if (isEnded) return "THANK YOU FOR JOINING";
    if (isLive) return "ENTER THE AWAKENING";
    if (countdown.isComplete || countdown.hours === 0) return "YOU'RE ALMOST LIVE";
    return "THE EXPERIENCE BEGINS SOON";
  }, [countdown.hours, countdown.isComplete, isEnded, isLive, isLocked]);

  const statusPill = useMemo(() => {
    if (isLocked) {
      return {
        label: "ACCESS REQUIRED",
        tone: "border-[#B0267A]/60 bg-[#B0267A]/15 text-[#f5c2e0]",
      };
    }
    if (isEnded) {
      return { label: "EVENT ENDED", tone: "border-zinc-600 bg-zinc-900/80 text-zinc-300" };
    }
    if (isLive) {
      return { label: "LIVE NOW", tone: "border-[#1E40AF]/70 bg-[#1E40AF]/20 text-[#93c5fd]" };
    }
    if (accessStatus === "verified" && countdown.isComplete && !isStreamStateLoading) {
      return {
        label: "LIVE READY",
        tone: "border-[#1E40AF]/60 bg-[#1E40AF]/15 text-[#93c5fd]",
      };
    }
    if (accessStatus === "verified") {
      return {
        label: isStreamStateLoading ? "SYNCING SIGNAL" : "WAITING FOR LIVE SIGNAL",
        tone: "border-white/15 bg-[#111111]/80 text-zinc-300",
      };
    }
    return { label: "VERIFYING PASS", tone: "border-white/15 bg-[#111111]/80 text-zinc-400" };
  }, [accessStatus, countdown.isComplete, isEnded, isLive, isLocked, isStreamStateLoading]);

  const verifiedLabel =
    accessStatus === "verified" && !isLive && !isLocked ? "PASS VERIFIED" : null;

  const primaryCta = useMemo(() => {
    if (isLocked) {
      return {
        label: "GET YOUR PASS",
        href: "/dashboard/merch",
        disabled: false,
        action: "link" as const,
      };
    }
    if (isEnded) {
      return { label: "EVENT CONCLUDED", href: undefined, disabled: true, action: "button" as const };
    }
    if (isLive) {
      return {
        label: "ENTER LIVE EXPERIENCE",
        href: undefined,
        disabled: false,
        action: "enter" as const,
      };
    }
    return { label: "WAITING FOR LIVE", href: undefined, disabled: true, action: "button" as const };
  }, [isEnded, isLive, isLocked]);

  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-[#0B090A] pt-safe pb-safe text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,64,175,0.22),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(176,38,122,0.16),transparent_50%)]" />
      <WaveformAccentCss />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10 lg:grid lg:grid-cols-12 lg:gap-8">
        <section className="flex flex-col lg:col-span-8">
          <div className="relative overflow-hidden rounded-3xl border border-[#1E40AF]/30 bg-[#111111]/70 p-6 shadow-[0_0_40px_rgba(30,64,175,0.18)] backdrop-blur-md md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(30,64,175,0.12),transparent_45%)]" />

            <div className="relative">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.35em] text-[#1E40AF]">
                {EVENT_LOBBY.eyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-bold uppercase tracking-[0.18em] text-white md:text-5xl md:tracking-[0.22em]">
                {EVENT_LOBBY.title}
              </h1>
              <p className="mt-3 text-sm text-zinc-400">{EVENT_LOBBY.venue}</p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.58rem] font-bold uppercase tracking-[0.18em] ${statusPill.tone}`}
                >
                  <Radio className="h-3.5 w-3.5" aria-hidden="true" />
                  {statusPill.label}
                </span>
                {verifiedLabel && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#1E40AF]/50 bg-[#1E40AF]/10 px-4 py-2 text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[#93c5fd]">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    {verifiedLabel}
                  </span>
                )}
              </div>

              <h2 className="mt-8 text-xl font-bold uppercase tracking-widest text-white md:text-3xl">
                {heroHeading}
              </h2>

              {!isLocked && !isEnded && (
                <div className="mt-8 grid grid-cols-4 gap-2 md:gap-4">
                  <CountdownBlock value={countdown.days} label="Days" />
                  <CountdownBlock value={countdown.hours} label="Hours" />
                  <CountdownBlock value={countdown.minutes} label="Min" />
                  <CountdownBlock value={countdown.seconds} label="Sec" />
                </div>
              )}

              {isLocked && (
                <div className="mt-8 flex items-start gap-4 rounded-2xl border border-[#B0267A]/40 bg-[#B0267A]/10 p-5">
                  <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[#B0267A]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-white">
                      Ticket Required
                    </p>
                    <p className="mt-2 text-sm text-zinc-400">
                      Secure your pass to enter the live recording experience, community chat,
                      and multi-layer concert feeds.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                {primaryCta.action === "link" && primaryCta.href ? (
                  <Link
                    href={primaryCta.href}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#1E40AF]/70 bg-[#1E40AF]/20 px-8 py-3 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_24px_rgba(30,64,175,0.35)] transition hover:bg-[#1E40AF]/30"
                  >
                    {primaryCta.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={primaryCta.disabled}
                    onClick={primaryCta.action === "enter" ? onEnterLive : undefined}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#1E40AF]/70 bg-[#1E40AF]/20 px-8 py-3 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_24px_rgba(30,64,175,0.35)] transition enabled:hover:bg-[#1E40AF]/30 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-zinc-900/60 disabled:text-zinc-500 disabled:shadow-none"
                  >
                    {primaryCta.label}
                  </button>
                )}

                <p className="text-xs text-zinc-500">{EVENT_LOBBY.streamQualityLabel}</p>
              </div>
            </div>
          </div>

          {showSidePanels ? <PreLiveLobbyStatCards /> : null}
        </section>

        {showSidePanels ? (
          <div className="lg:col-span-4">
            <PreLiveLobbySidePanels />
          </div>
        ) : null}
      </div>
    </main>
  );
}
