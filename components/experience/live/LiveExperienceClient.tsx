"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ExperienceHoldingRoomPageClient from "@/components/experience/holding-room/ExperienceHoldingRoomPageClient";
import GoingLiveTransition from "@/components/experience/live/GoingLiveTransition";
import IgLiveShell from "@/components/experience/live/ig/IgLiveShell";
import PassActivatingShell from "@/components/live/PassActivatingShell";
import { LiveExperienceStreamProvider } from "@/lib/experience/LiveExperienceStreamContext";
import { LiveStreamReactionsProvider } from "@/lib/experience/LiveStreamReactionsContext";
import { useAttendeeLiveState } from "@/lib/experience/useAttendeeLiveState";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import { EXPERIENCE_LIVE_PATH } from "@/lib/experience/live-routes";
import { useLobbyCountdown } from "@/lib/live/useLobbyCountdown";
import {
  BroadcastHealthProvider,
  useBroadcastHealth,
} from "@/lib/parable/BroadcastHealthContext";
import { useLiveAccessVerification } from "@/lib/useLiveAccessVerification";
import { useLiveSeedWallet } from "@/lib/useLiveSeedWallet";

const StreamPaywallOverlay = dynamic(
  () => import("@/components/live/StreamPaywallOverlay"),
  { ssr: false },
);

const GOING_LIVE_MS = 1_400;

type LiveExperienceClientProps = {
  initialCountdownConfig?: EventCountdownConfig;
};

export default function LiveExperienceClient({
  initialCountdownConfig,
}: LiveExperienceClientProps) {
  return (
    <BroadcastHealthProvider surface="experience">
      <LiveExperienceClientInner initialCountdownConfig={initialCountdownConfig} />
    </BroadcastHealthProvider>
  );
}

function LiveExperienceClientInner({
  initialCountdownConfig,
}: LiveExperienceClientProps) {
  const health = useBroadcastHealth();
  const { phase, verificationAttempt } = useLiveAccessVerification();
  const { isLive: streamIsLive } = useAttendeeLiveState();
  const { refresh: refreshSeedBalance } = useLiveSeedWallet();
  const { config, countdown, eventPhase, isLoading: countdownLoading } = useLobbyCountdown({
    initialConfig: initialCountdownConfig,
  });

  const [openingLiveRoom, setOpeningLiveRoom] = useState(false);
  const wasPreConcertRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (countdownLoading) return;

    if (wasPreConcertRef.current === null) {
      wasPreConcertRef.current = eventPhase === "waiting";
      return;
    }

    if (eventPhase !== "waiting" && wasPreConcertRef.current) {
      setOpeningLiveRoom(true);
      const timerId = window.setTimeout(() => setOpeningLiveRoom(false), GOING_LIVE_MS);
      wasPreConcertRef.current = false;
      return () => window.clearTimeout(timerId);
    }

    if (eventPhase === "waiting") {
      wasPreConcertRef.current = true;
      setOpeningLiveRoom(false);
    }
  }, [countdownLoading, eventPhase]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("seeds") !== "success") return;

    void refreshSeedBalance();

    const url = new URL(window.location.href);
    url.pathname = EXPERIENCE_LIVE_PATH;
    url.searchParams.delete("seeds");
    const query = url.searchParams.toString();
    window.history.replaceState({}, "", query ? `${url.pathname}?${query}` : url.pathname);
  }, [refreshSeedBalance]);

  if (phase === "checking" || phase === "activating_pass") {
    return <PassActivatingShell attempt={verificationAttempt} />;
  }

  if (phase === "locked") {
    return (
      <main className="experience-live-root flex min-h-dvh w-full flex-col items-center justify-center px-4 pt-safe pb-safe text-white">
        <div className="w-full max-w-lg rounded-2xl border border-white/8 bg-brand-panel p-8 text-center">
          <p className="font-ui text-[0.6rem] font-bold uppercase tracking-[0.24em] text-brand-blue">
            Vital Organs Entertainment
          </p>
          <h1 className="mt-4 font-headline text-2xl uppercase tracking-[0.12em]">
            300 Awakening Live Experience
          </h1>
          <p className="mt-4 font-body text-sm text-brand-muted">
            A live pass is required to join the experience when the broadcast goes live.
          </p>
          <Link
            href="/dashboard/merch"
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-brand-blue/50 bg-brand-blue/10 px-8 font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] text-brand-blue transition hover:bg-brand-blue/20"
          >
            Get Your Pass
          </Link>
        </div>
      </main>
    );
  }

  const concertHasBegun = eventPhase !== "waiting";
  const showLiveRoom = concertHasBegun && !openingLiveRoom;
  const showPaywall = phase === "guest_hub";
  const paywallOverlay = showPaywall ? <StreamPaywallOverlay /> : undefined;
  const shellMode = streamIsLive ? "live" : "waiting";

  if (!showLiveRoom) {
    if (openingLiveRoom) {
      return <GoingLiveTransition visible />;
    }

    return (
      <main className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-brand-black pt-safe pb-safe">
        <ExperienceHoldingRoomPageClient initialCountdownConfig={initialCountdownConfig} />
      </main>
    );
  }

  return (
    <LiveStreamReactionsProvider enabled={streamIsLive && !health.safeMode}>
      <LiveExperienceStreamProvider enabled={streamIsLive}>
        <IgLiveShell
          mode={shellMode}
          showPaywall={showPaywall}
          paywallOverlay={paywallOverlay}
          waiting={{
            countdown,
            countdownConfig: config,
            countdownLoading,
          }}
        />
      </LiveExperienceStreamProvider>
    </LiveStreamReactionsProvider>
  );
}
