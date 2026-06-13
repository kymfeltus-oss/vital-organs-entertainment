"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ExperienceActionId } from "@/components/experience/live/experience-actions";
import ExperienceLiveLayout from "@/components/experience/live/ExperienceLiveLayout";
import GoingLiveTransition from "@/components/experience/live/GoingLiveTransition";
import LiveViewingExperience from "@/components/experience/live/LiveViewingExperience";
import WaitingRoom from "@/components/experience/live/WaitingRoom";
import PassActivatingShell from "@/components/live/PassActivatingShell";
import { useAttendeeLiveState } from "@/lib/experience/useAttendeeLiveState";
import { useEventCountdown } from "@/lib/experience/useEventCountdown";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import { useCountdownConfig } from "@/lib/useCountdownConfig";
import { useLiveAccessVerification } from "@/lib/useLiveAccessVerification";

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
  const { phase, verificationAttempt } = useLiveAccessVerification();
  const { isLive: streamIsLive, isLoading: isStreamStateLoading } = useAttendeeLiveState();
  const { config: countdownConfig, isLoading: countdownLoading } = useCountdownConfig({
    initialConfig: initialCountdownConfig,
  });
  const countdown = useEventCountdown(countdownConfig.start_time);

  const [openAction, setOpenAction] = useState<ExperienceActionId>(null);
  const [goingLive, setGoingLive] = useState(false);
  const wasLiveRef = useRef(false);

  useEffect(() => {
    if (isStreamStateLoading) return;

    if (streamIsLive && !wasLiveRef.current) {
      setGoingLive(true);
      const timerId = window.setTimeout(() => setGoingLive(false), GOING_LIVE_MS);
      wasLiveRef.current = true;
      return () => window.clearTimeout(timerId);
    }

    if (!streamIsLive) {
      wasLiveRef.current = false;
      setGoingLive(false);
    }
  }, [isStreamStateLoading, streamIsLive]);

  if (phase === "checking" || phase === "activating_pass") {
    return <PassActivatingShell attempt={verificationAttempt} />;
  }

  if (phase === "locked") {
    return (
      <main className="flex min-h-dvh w-full flex-col items-center justify-center bg-brand-black px-4 pt-safe pb-safe text-white">
        <div className="w-full max-w-lg rounded-2xl border border-brand-border bg-brand-panel p-8 text-center">
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

  const showLiveView = streamIsLive && !goingLive;
  const showPaywall = phase === "guest_hub";

  const stage = showLiveView ? (
    <LiveViewingExperience
      showPaywall={showPaywall}
      paywallOverlay={showPaywall ? <StreamPaywallOverlay /> : undefined}
    />
  ) : (
    <WaitingRoom
      countdown={countdown}
      countdownConfig={countdownConfig}
      countdownLoading={countdownLoading && !initialCountdownConfig}
    />
  );

  return (
    <>
      <ExperienceLiveLayout
        variant={showLiveView ? "live" : "waiting"}
        stage={stage}
        openAction={openAction}
        onOpenAction={setOpenAction}
        onCloseAction={() => setOpenAction(null)}
      />

      <GoingLiveTransition visible={goingLive} />
    </>
  );
}
