"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ExperienceHoldingRoomPageClient from "@/components/experience/holding-room/ExperienceHoldingRoomPageClient";
import GoingLiveTransition from "@/components/experience/live/GoingLiveTransition";
import ViewerPovGoLiveShell from "@/components/experience/live/pov/ViewerPovGoLiveShell";
import PassActivatingShell from "@/components/live/PassActivatingShell";
import { GOING_LIVE_TRANSITION_MS } from "@/lib/experience/live-go-live-transition";
import {
  computeEventCountdownPhase,
  type EventCountdownConfig,
  type EventCountdownPhase,
} from "@/lib/live/countdown-config";
import type { CountdownParts } from "@/lib/live/event-lobby";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import { EXPERIENCE_LIVE_PATH } from "@/lib/experience/live-routes";
import { buildAttendeeGateUrl } from "@/lib/auth/routing";
import { useLobbyCountdown } from "@/lib/live/useLobbyCountdown";
import { BroadcastHealthProvider } from "@/lib/parable/BroadcastHealthContext";
import { useLiveAccessVerification } from "@/lib/useLiveAccessVerification";
import { useLiveSeedWallet } from "@/lib/useLiveSeedWallet";

const GOING_LIVE_MS = GOING_LIVE_TRANSITION_MS;

/** Never open live room unless both SSR schedule and synced client agree. */
function resolveAttendeeEventPhase(
  clientPhase: EventCountdownPhase,
  serverPhase: EventCountdownPhase,
): EventCountdownPhase {
  if (clientPhase === "live" && serverPhase === "live") return "live";
  if (clientPhase === "waiting" || serverPhase === "waiting") return "waiting";
  return "ended";
}

type LiveExperienceClientProps = {
  initialCountdownConfig?: EventCountdownConfig;
  initialCountdown?: CountdownParts;
  initialProfile: AttendeeProfileSnapshot;
};

export default function LiveExperienceClient({
  initialCountdownConfig,
  initialCountdown,
  initialProfile,
}: LiveExperienceClientProps) {
  return (
    <BroadcastHealthProvider surface="experience">
      <LiveExperienceClientInner
        initialCountdownConfig={initialCountdownConfig}
        initialCountdown={initialCountdown}
        initialProfile={initialProfile}
      />
    </BroadcastHealthProvider>
  );
}

function LiveExperienceClientInner({
  initialCountdownConfig,
  initialCountdown,
  initialProfile,
}: LiveExperienceClientProps) {
  const { phase, verificationAttempt } = useLiveAccessVerification();
  const { refresh: refreshSeedBalance } = useLiveSeedWallet();
  const { config: countdownConfig, eventPhase, isLoading: countdownLoading } = useLobbyCountdown({
    initialConfig: initialCountdownConfig,
    initialCountdown,
  });

  const serverPhase = computeEventCountdownPhase(
    initialCountdownConfig.start_time,
    initialCountdownConfig.end_time,
  );
  const routingPhase = resolveAttendeeEventPhase(eventPhase, serverPhase);

  const [openingLiveRoom, setOpeningLiveRoom] = useState(false);
  const wasPreConcertRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (countdownLoading) return;

    if (wasPreConcertRef.current === null) {
      wasPreConcertRef.current = routingPhase === "waiting";
      return;
    }

    if (routingPhase === "live" && wasPreConcertRef.current) {
      setOpeningLiveRoom(true);
      const timerId = window.setTimeout(() => setOpeningLiveRoom(false), GOING_LIVE_MS);
      wasPreConcertRef.current = false;
      return () => window.clearTimeout(timerId);
    }

    if (routingPhase === "waiting") {
      wasPreConcertRef.current = true;
      setOpeningLiveRoom(false);
    }
  }, [countdownLoading, routingPhase]);

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
            This live experience is free. Sign in to enter the holding room and join when the
            broadcast goes live.
          </p>
          <Link
            href={buildAttendeeGateUrl(EXPERIENCE_LIVE_PATH)}
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-brand-blue/50 bg-brand-blue/10 px-8 font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] text-brand-blue transition hover:bg-brand-blue/20"
          >
            Sign In to Enter
          </Link>
        </div>
        </div>
      </main>
    );
  }

  const showLiveRoom = routingPhase === "live" && !openingLiveRoom;

  if (!showLiveRoom) {
    if (openingLiveRoom) {
      return <GoingLiveTransition visible durationMs={GOING_LIVE_MS} />;
    }

    return (
      <main className="live-holding-shell">
        <ExperienceHoldingRoomPageClient
          initialCountdownConfig={initialCountdownConfig}
          initialCountdown={initialCountdown}
          initialProfile={initialProfile}
        />
      </main>
    );
  }

  return <ViewerPovGoLiveShell initialProfile={initialProfile} />;
}
