import type { Metadata } from "next";
import LivePageRouterClient from "@/components/experience/live/LivePageRouterClient";
import { loadTabPageProfile } from "@/lib/experience/load-tab-page-profile";
import { computeEventCountdownPhase } from "@/lib/live/countdown-config";
import { computeCountdown } from "@/lib/live/event-lobby";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";

/** Dynamic — countdown schedule and live phase resolve per request. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "300 Awakening Experience",
  description: "Join the 300 Awakening live experience.",
};

export default async function LivePage() {
  const countdownConfig = await loadActiveCountdownConfig();

  // SAFE TESTING TOGGLE — set FORCE_HOLDING_ROOM_TESTING="true" in .env.local (dev only).
  const isLocalDev = process.env.NODE_ENV !== "production";
  const forceHoldingRoom = isLocalDev && process.env.FORCE_HOLDING_ROOM_TESTING === "true";

  const initialPhase = forceHoldingRoom
    ? "holding"
    : computeEventCountdownPhase(countdownConfig.start_time, countdownConfig.end_time);

  const initialCountdown = computeCountdown(countdownConfig.start_time);
  const initialProfile = await loadTabPageProfile();

  return (
    <div className="relative min-h-dvh overflow-hidden bg-brand-black text-brand-blue">
      <LivePageRouterClient
        initialPhase={initialPhase}
        forceHoldingRoom={forceHoldingRoom}
        countdownConfig={countdownConfig}
        initialCountdown={initialCountdown}
        initialProfile={initialProfile}
      />
    </div>
  );
}
