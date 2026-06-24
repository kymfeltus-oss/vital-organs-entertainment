"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ExperienceLiveOutroShell from "@/components/experience/live/ExperienceLiveOutroShell";
import ExperienceHoldingRoomPageClient from "@/components/experience/holding-room/ExperienceHoldingRoomPageClient";
import GoingLiveTransition from "@/components/experience/live/GoingLiveTransition";
import { IgLiveChatProvider } from "@/components/experience/live/ig/IgLiveChatContext";
import ViewerPovGoLiveShell from "@/components/experience/live/pov/ViewerPovGoLiveShell";
import PassActivatingShell from "@/components/live/PassActivatingShell";
import LightweightLiveLoading from "@/components/live/LightweightLiveLoading";
import {
  computeEventLifecycleStage,
  isPreLiveLifecycleStage,
  resolveAttendeeLifecycleStage,
  type EventLifecycleStage,
} from "@/lib/experience/event-lifecycle";
import { useLiveAnnouncementRedirect } from "@/lib/experience/useLiveAnnouncementRedirect";
import {
  isLiveHoldingOverride,
  isLivePreviewOverride,
  shouldDeferBackgroundLiveSync,
  shouldInitializeLiveStream,
  shouldShowLiveRoomShell,
} from "@/lib/experience/live-stream-gate";
import { GOING_LIVE_TRANSITION_MS } from "@/lib/experience/live-go-live-transition";
import {
  computeEventCountdownPhase,
  type EventCountdownConfig,
  type EventCountdownPhase,
} from "@/lib/live/countdown-config";
import type { CountdownParts } from "@/lib/live/event-lobby";
import { computeCountdown } from "@/lib/live/event-lobby";
import { COUNTDOWN_CONFIG_UPDATED_EVENT } from "@/lib/live/countdown-config-sync";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import { EXPERIENCE_LIVE_PATH } from "@/lib/experience/live-routes";
import { buildAttendeeGateUrl } from "@/lib/auth/routing";
import { useAttendeeLiveState } from "@/lib/experience/useAttendeeLiveState";
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
  initialLifecycleStage: EventLifecycleStage;
  initialProfile: AttendeeProfileSnapshot;
};

export default function LiveExperienceClient({
  initialCountdownConfig,
  initialCountdown,
  initialLifecycleStage,
  initialProfile,
}: LiveExperienceClientProps) {
  return (
    <BroadcastHealthProvider surface="experience">
      <LiveExperienceClientInner
        initialCountdownConfig={initialCountdownConfig}
        initialCountdown={initialCountdown}
        initialLifecycleStage={initialLifecycleStage}
        initialProfile={initialProfile}
      />
    </BroadcastHealthProvider>
  );
}

function LiveExperienceClientInner({
  initialCountdownConfig,
  initialCountdown,
  initialLifecycleStage,
  initialProfile,
}: LiveExperienceClientProps) {
  const searchParams = useSearchParams();
  const previewOverride = isLivePreviewOverride(searchParams);
  const holdingOverride = isLiveHoldingOverride(searchParams);
  const { phase, verificationAttempt } = useLiveAccessVerification();
  const accessGateReady =
    phase !== "checking" && phase !== "activating_pass" && phase !== "locked";
  const { refresh: refreshSeedBalance } = useLiveSeedWallet();
  const {
    config: countdownConfig,
    eventPhase,
    isLoading: countdownLoading,
  } = useLobbyCountdown({
    initialConfig: initialCountdownConfig,
    initialCountdown,
  });

  const scheduleStage = useMemo(() => {
    const startIso =
      countdownLoading && initialCountdownConfig
        ? initialCountdownConfig.start_time
        : countdownConfig.start_time;
    const endIso =
      countdownLoading && initialCountdownConfig
        ? initialCountdownConfig.end_time
        : countdownConfig.end_time;

    return computeEventLifecycleStage(startIso, endIso);
  }, [
    countdownConfig.end_time,
    countdownConfig.start_time,
    countdownLoading,
    initialCountdownConfig,
  ]);

  const deferBackgroundLiveSync = shouldDeferBackgroundLiveSync(
    scheduleStage,
    countdownLoading,
    previewOverride,
  );

  const { isLive: broadcastIsLive } = useAttendeeLiveState({
    enabled: !deferBackgroundLiveSync,
  });

  const serverPhase = computeEventCountdownPhase(
    initialCountdownConfig?.start_time ?? countdownConfig.start_time,
    initialCountdownConfig?.end_time ?? countdownConfig.end_time,
  );
  const routingPhase = resolveAttendeeEventPhase(eventPhase, serverPhase);

  const lifecycleStage = useMemo(() => {
    if (holdingOverride) {
      return "holding";
    }

    if (countdownLoading && !previewOverride) {
      return scheduleStage;
    }

    return resolveAttendeeLifecycleStage(scheduleStage, {
      broadcastIsLive,
      countdownPhase: routingPhase,
    });
  }, [
    broadcastIsLive,
    countdownLoading,
    holdingOverride,
    previewOverride,
    routingPhase,
    scheduleStage,
  ]);

  useEffect(() => {
    if (!broadcastIsLive) return;
    window.dispatchEvent(new Event(COUNTDOWN_CONFIG_UPDATED_EVENT));
  }, [broadcastIsLive]);

  const [openingLiveRoom, setOpeningLiveRoom] = useState(false);
  const wasPreConcertRef = useRef<boolean | null>(null);

  useLiveAnnouncementRedirect(accessGateReady);

  useEffect(() => {
    if (countdownLoading) return;

    if (wasPreConcertRef.current === null) {
      wasPreConcertRef.current = isPreLiveLifecycleStage(lifecycleStage);
      return;
    }

    if (lifecycleStage === "live" && wasPreConcertRef.current) {
      setOpeningLiveRoom(true);
      const timerId = window.setTimeout(() => setOpeningLiveRoom(false), GOING_LIVE_MS);
      wasPreConcertRef.current = false;
      return () => window.clearTimeout(timerId);
    }

    if (isPreLiveLifecycleStage(lifecycleStage)) {
      wasPreConcertRef.current = true;
      setOpeningLiveRoom(false);
    }
  }, [countdownLoading, lifecycleStage]);

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

  const streamGateInput = {
    lifecycleStage,
    countdownLoading,
    openingLiveRoom,
    previewOverride,
  };

  const showLiveRoom = shouldShowLiveRoomShell(streamGateInput);
  const streamEnabled = shouldInitializeLiveStream(streamGateInput);

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

  const announcementConfig = initialCountdownConfig ?? countdownConfig;

  if (!showLiveRoom) {
    if (openingLiveRoom) {
      return <GoingLiveTransition visible durationMs={GOING_LIVE_MS} />;
    }

    if (lifecycleStage === "announcement") {
      return <LightweightLiveLoading />;
    }

    if (lifecycleStage === "ended") {
      return (
        <ExperienceLiveOutroShell
          config={announcementConfig}
        />
      );
    }

    return (
      <main className="live-holding-shell">
        <IgLiveChatProvider>
          <ExperienceHoldingRoomPageClient
            initialCountdownConfig={initialCountdownConfig}
            initialCountdown={initialCountdown}
            initialProfile={initialProfile}
          />
        </IgLiveChatProvider>
      </main>
    );
  }

  return <ViewerPovGoLiveShell initialProfile={initialProfile} streamEnabled={streamEnabled} />;
}
