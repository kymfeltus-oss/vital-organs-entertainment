"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import DashboardHeroSection from "@/components/dashboard/DashboardHeroSection";
import { SidebarSkeleton } from "@/components/dashboard/lobby/AttendeeEventLobbySidebar";
import PassActivatingShell from "@/components/live/PassActivatingShell";
import {
  computeEventCountdownPhase,
  type EventCountdownConfig,
  type EventCountdownPhase,
} from "@/lib/live/countdown-config";
import { computeCountdown, type CountdownParts } from "@/lib/live/event-lobby";
import { filterActivityByKinds } from "@/lib/live/live-activity";
import { useCountdownConfig } from "@/lib/useCountdownConfig";
import { useDeferredMount } from "@/lib/useDeferredMount";
import { useHybridLiveActivity } from "@/lib/useHybridLiveActivity";
import { useLiveAccessVerification } from "@/lib/useLiveAccessVerification";
import { useLiveStreamState } from "@/lib/useLiveStreamState";
import { useLobbyCta } from "@/components/dashboard/lobby/useLobbyCta";
import { DEVICE_FIT_PAGE, DEVICE_FIT_SCROLL, LOBBY_GRID } from "@/lib/responsive";

const AttendeeEventLobbySidebar = dynamic(
  () => import("@/components/dashboard/lobby/AttendeeEventLobbySidebar"),
  { loading: () => <SidebarSkeleton /> },
);

const AttendeeEventLobbyBelowHero = dynamic(() =>
  import("@/components/dashboard/lobby/AttendeeEventLobbyDeferred").then(
    (mod) => mod.AttendeeEventLobbyBelowHero,
  ),
);

const AttendeeEventLobbyRightRail = dynamic(() =>
  import("@/components/dashboard/lobby/AttendeeEventLobbyDeferred").then(
    (mod) => mod.AttendeeEventLobbyRightRail,
  ),
);

const AttendeeEventLobbyBottomNav = dynamic(() =>
  import("@/components/dashboard/lobby/AttendeeEventLobbyDeferred").then(
    (mod) => mod.AttendeeEventLobbyBottomNav,
  ),
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

function useEventPhase(startTime: string, endTime: string): EventCountdownPhase {
  const [phase, setPhase] = useState<EventCountdownPhase>(() =>
    computeEventCountdownPhase(startTime, endTime),
  );

  useEffect(() => {
    const tick = () => setPhase(computeEventCountdownPhase(startTime, endTime));
    tick();
    const intervalId = setInterval(tick, 1_000);
    return () => clearInterval(intervalId);
  }, [endTime, startTime]);

  return phase;
}

type AttendeeEventLobbyClientProps = {
  initialCountdownConfig: EventCountdownConfig;
};

export default function AttendeeEventLobbyClient({
  initialCountdownConfig,
}: AttendeeEventLobbyClientProps) {
  const deferredReady = useDeferredMount();
  const { phase, verificationAttempt } = useLiveAccessVerification();
  const { isLive: streamIsLive, isLoading: isStreamStateLoading } = useLiveStreamState();
  const { pool, visible: activityVisible } = useHybridLiveActivity({ enabled: deferredReady });
  const { config: countdownConfig } = useCountdownConfig({
    initialConfig: initialCountdownConfig,
  });
  const eventPhase = useEventPhase(countdownConfig.start_time, countdownConfig.end_time);
  const countdown = useEventCountdown(countdownConfig.start_time);
  const cta = useLobbyCta(countdownConfig, eventPhase, phase, streamIsLive);

  const movementActivity = useMemo(() => {
    if (!deferredReady) return [];
    const fromVisible = filterActivityByKinds(activityVisible, [
      "system",
      "join",
      "share",
      "music",
    ]);
    if (fromVisible.length >= 4) return fromVisible.slice(0, 5);
    return filterActivityByKinds(pool, ["system", "join", "share", "music"]).slice(0, 5);
  }, [activityVisible, deferredReady, pool]);

  const prayerActivity = useMemo(() => {
    if (!deferredReady) return [];
    const fromVisible = filterActivityByKinds(activityVisible, ["prayer"]);
    if (fromVisible.length >= 3) return fromVisible.slice(0, 3);
    return filterActivityByKinds(pool, ["prayer"]).slice(0, 3);
  }, [activityVisible, deferredReady, pool]);

  const chatActivity = useMemo(() => {
    if (!deferredReady) return [];
    return activityVisible.slice(0, 5);
  }, [activityVisible, deferredReady]);

  const showLiveSignal = eventPhase === "live" && streamIsLive && !isStreamStateLoading;

  if (phase === "checking" || phase === "activating_pass") {
    return <PassActivatingShell attempt={verificationAttempt} />;
  }

  return (
    <div className={`${DEVICE_FIT_PAGE} overflow-hidden bg-[#050406] text-white`}>
      <div className={LOBBY_GRID}>
        {deferredReady ? <AttendeeEventLobbySidebar /> : <SidebarSkeleton />}

        <main className={`${DEVICE_FIT_SCROLL} px-[clamp(1rem,3vw,1.5rem)] pt-5 pb-32 lg:pb-5`}>
          <div className="mb-4 lg:hidden">
            <Image
              src="/branding/300-awakening-logo.png"
              alt="300 Awakening"
              width={150}
              height={88}
              className="mx-auto h-auto w-[150px] object-contain"
              style={{ width: "auto", height: "auto", maxWidth: 150, maxHeight: 88 }}
              priority
            />
          </div>

          <DashboardHeroSection
            config={countdownConfig}
            countdown={countdown}
            eventPhase={eventPhase}
            showLiveSignal={showLiveSignal}
            ctaLabel={cta.label}
            ctaHref={cta.href}
            ctaDisabled={cta.disabled}
          />

          {deferredReady ? (
            <AttendeeEventLobbyBelowHero
              movementActivity={movementActivity}
              prayerActivity={prayerActivity}
              chatActivity={chatActivity}
              href={cta.href}
              disabled={cta.disabled}
              label={cta.label}
            />
          ) : null}
        </main>

        {deferredReady ? (
          <AttendeeEventLobbyRightRail chatActivity={chatActivity} />
        ) : (
          <div className="hidden w-[360px] shrink-0 border-l border-white/10 bg-[#050406] lg:block" />
        )}
      </div>

      {deferredReady ? <AttendeeEventLobbyBottomNav /> : null}
    </div>
  );
}
