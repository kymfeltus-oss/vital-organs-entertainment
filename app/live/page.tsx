import type { Metadata } from "next";
import ExperienceHoldingRoomPageClient from "@/components/experience/holding-room/ExperienceHoldingRoomPageClient";
import LiveDataLoader from "@/components/experience/live/LiveDataLoader";
import { computeEventCountdownPhase } from "@/lib/live/countdown-config";
import { computeCountdown } from "@/lib/live/event-lobby";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";
import { buildAttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

/** Dynamic — countdown schedule and live phase resolve per request. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "300 Awakening Experience",
  description: "Join the 300 Awakening live experience.",
};

/** Attendee live entry — pre-live holding room countdown, live phase shows the stream shell. */
export default async function LivePage() {
  const countdownConfig = await loadActiveCountdownConfig();
  const countdownPhase = computeEventCountdownPhase(
    countdownConfig.start_time,
    countdownConfig.end_time,
  );

  return (
    <div className="relative min-h-dvh overflow-hidden bg-brand-black text-brand-blue">
      {countdownPhase === "live" ? (
        <LiveDataLoader />
      ) : (
        <ExperienceHoldingRoomPageClient
          initialCountdownConfig={countdownConfig}
          initialCountdown={computeCountdown(countdownConfig.start_time)}
          initialProfile={buildAttendeeProfileSnapshot(null, null)}
        />
      )}
    </div>
  );
}
