"use client";

/** Attendee orchestrator only — access gate, pre-live lobby, live room grid. No ops/production UI. */

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import PassActivatingShell from "@/components/live/PassActivatingShell";
import type { AccessStatus } from "@/lib/live/event-lobby";
import { useLiveAccessVerification } from "@/lib/useLiveAccessVerification";

const PreLiveLobbyClient = dynamic(
  () => import("@/components/live/PreLiveLobbyClient"),
  { ssr: false },
);

const LivePlatformGridClient = dynamic(
  () => import("@/components/live/LivePlatformGridClient"),
  { ssr: false },
);

const StreamPaywallOverlay = dynamic(
  () => import("@/components/live/StreamPaywallOverlay"),
  { ssr: false },
);

export default function LiveRoomClient() {
  const { phase, verificationAttempt, userEmail, userId } =
    useLiveAccessVerification();
  const [hasEnteredLive, setHasEnteredLive] = useState(false);

  const accessStatus: AccessStatus = useMemo(() => {
    if (phase === "locked") return "locked";
    if (phase === "cleared" || phase === "guest_hub") return "verified";
    return "checking";
  }, [phase]);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_LIVE_RENDER_DEBUG !== "true") return;

    console.debug("[LIVE_RENDER_DEBUG]", {
      phase,
      accessStatus,
      hasEnteredLive,
    });
  }, [phase, accessStatus, hasEnteredLive]);

  if (phase === "checking" || phase === "activating_pass") {
    return <PassActivatingShell attempt={verificationAttempt} />;
  }

  if (phase === "locked") {
    return <StreamPaywallOverlay variant="lockdown" />;
  }

  const showStreamPaywall = phase === "guest_hub";

  if (
    hasEnteredLive &&
    (phase === "cleared" || phase === "guest_hub")
  ) {
    return (
      <LivePlatformGridClient
        showStreamPaywall={showStreamPaywall}
        isActivatingPass={false}
        userEmail={userEmail}
        userId={userId}
      />
    );
  }

  return (
    <PreLiveLobbyClient
      accessStatus={accessStatus}
      onEnterLive={() => setHasEnteredLive(true)}
    />
  );
}
