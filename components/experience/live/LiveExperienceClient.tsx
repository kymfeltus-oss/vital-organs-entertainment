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
import { LiveExperienceStreamProvider } from "@/lib/experience/LiveExperienceStreamContext";
import { LiveStreamReactionsProvider } from "@/lib/experience/LiveStreamReactionsContext";
import { shouldShowCountdownTimer } from "@/lib/experience/countdown-display";
import { useAttendeeLiveState } from "@/lib/experience/useAttendeeLiveState";
import { useEventCountdown } from "@/lib/experience/useEventCountdown";
import { useMobilePortraitLayout } from "@/lib/experience/useMobilePortraitLayout";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import {
  BroadcastHealthProvider,
  useBroadcastHealth,
} from "@/lib/parable/BroadcastHealthContext";
import { useCountdownConfig } from "@/lib/useCountdownConfig";
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
  const { isLive: streamIsLive, isLoading: isStreamStateLoading } = useAttendeeLiveState();
  const { config: countdownConfig, isLoading: countdownLoading } = useCountdownConfig({
    initialConfig: initialCountdownConfig,
  });
  const countdown = useEventCountdown(countdownConfig.start_time);
  const mobilePortraitLayout = useMobilePortraitLayout();
  const { refresh: refreshSeedBalance } = useLiveSeedWallet();

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("seeds") !== "success") return;

    void refreshSeedBalance();

    const url = new URL(window.location.href);
    url.pathname = "/experience/live";
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
        <div className="w-full max-w-lg rounded-2xl border border-white/8 bg-[#111111] p-8 text-center">
          <p className="font-ui text-[0.6rem] font-bold uppercase tracking-[0.24em] exp-text-blue">
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
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-[#1E40AF]/50 bg-[#1E40AF]/10 px-8 font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] exp-text-blue transition hover:bg-[#1E40AF]/20"
          >
            Get Your Pass
          </Link>
        </div>
      </main>
    );
  }

  const showLiveView = streamIsLive && !goingLive;
  const showPaywall = phase === "guest_hub";
  const paywallOverlay = showPaywall ? <StreamPaywallOverlay /> : undefined;
  const statusLabel =
    countdownConfig.status_label?.trim() || "Waiting for live signal";
  const showCountdownTimer = shouldShowCountdownTimer(
    countdownConfig,
    countdownLoading && !initialCountdownConfig,
  );

  const stage = showLiveView ? (
    mobilePortraitLayout ? null : (
      <LiveViewingExperience
        showPaywall={showPaywall}
        paywallOverlay={paywallOverlay}
      />
    )
  ) : mobilePortraitLayout ? null : (
    <WaitingRoom
      countdown={countdown}
      countdownConfig={countdownConfig}
      countdownLoading={countdownLoading && !initialCountdownConfig}
    />
  );

  const layout = (
    <ExperienceLiveLayout
      variant={showLiveView ? "live" : "waiting"}
      stage={stage}
      mobilePortraitLayout={mobilePortraitLayout}
      streamIsLive={streamIsLive}
      isStreamStateLoading={isStreamStateLoading}
      statusLabel={statusLabel}
      heroBackgroundUrl={countdownConfig.hero_background_url}
      countdown={countdown}
      countdownLoading={countdownLoading && !initialCountdownConfig}
      showCountdownTimer={showCountdownTimer}
      showPaywall={showPaywall}
      paywallOverlay={paywallOverlay}
      openAction={openAction}
      onOpenAction={setOpenAction}
      onCloseAction={() => setOpenAction(null)}
    />
  );

  return (
    <LiveStreamReactionsProvider enabled={showLiveView && !health.safeMode}>
      {showLiveView ? (
        <LiveExperienceStreamProvider enabled={showLiveView}>
          {layout}
        </LiveExperienceStreamProvider>
      ) : (
        layout
      )}

      <GoingLiveTransition visible={goingLive} />
    </LiveStreamReactionsProvider>
  );
}
