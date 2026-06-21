"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ExperienceHoldingRoomPageClient from "@/components/experience/holding-room/ExperienceHoldingRoomPageClient";
import GoingLiveTransition from "@/components/experience/live/GoingLiveTransition";
import ViewerPovGoLiveShell from "@/components/experience/live/pov/ViewerPovGoLiveShell";
import PassActivatingShell from "@/components/live/PassActivatingShell";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import { EXPERIENCE_LIVE_PATH } from "@/lib/experience/live-routes";
import { useLobbyCountdown } from "@/lib/live/useLobbyCountdown";
import { BroadcastHealthProvider } from "@/lib/parable/BroadcastHealthContext";
import { useLiveAccessVerification } from "@/lib/useLiveAccessVerification";
import { useLiveSeedWallet } from "@/lib/useLiveSeedWallet";

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
  const { phase, verificationAttempt } = useLiveAccessVerification();
  const { refresh: refreshSeedBalance } = useLiveSeedWallet();
  const { eventPhase, isLoading: countdownLoading } = useLobbyCountdown({
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

    if (eventPhase === "live" && wasPreConcertRef.current) {
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
      <main className="live-access-page experience-live-root pb-safe pt-safe text-white">
        <div className="live-access-page__track">
        <div className="w-full rounded-2xl border border-white/8 bg-brand-panel p-8 text-center">
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
        </div>
      </main>
    );
  }

  const showLiveRoom = eventPhase === "live" && !openingLiveRoom;

  if (!showLiveRoom) {
    if (openingLiveRoom) {
      return <GoingLiveTransition visible />;
    }

    return (
      <main className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-brand-black">
        <ExperienceHoldingRoomPageClient initialCountdownConfig={initialCountdownConfig} />
      </main>
    );
  }

  return <ViewerPovGoLiveShell />;
}
