import type { Metadata } from "next";
import ExperienceHoldingRoomPageClient from "@/components/experience/holding-room/ExperienceHoldingRoomPageClient";
import LiveDataLoader from "@/components/experience/live/LiveDataLoader";
import { computeEventCountdownPhase } from "@/lib/live/countdown-config";
import { computeCountdown } from "@/lib/live/event-lobby";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";
import { buildAttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

/** Dynamic - countdown schedule resolves per request. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "300 Awakening Live | Vital Organs Entertainment",
  description: "Join the 300 Awakening live experience.",
};

/** Attendee live entry - pre-live shows the holding room, live shows the stream shell. */
export default async function LivePage() {
  const countdownConfig = await loadActiveCountdownConfig();
  const countdownPhase = computeEventCountdownPhase(
    countdownConfig.start_time,
    countdownConfig.end_time,
  );

  if (countdownPhase === "live") {
    return <LiveDataLoader />;
  }

  const initialProfile = buildAttendeeProfileSnapshot(null, null);
  const initialCountdown = computeCountdown(countdownConfig.start_time);

  return (
    <ExperienceHoldingRoomPageClient
      initialCountdownConfig={countdownConfig}
      initialCountdown={initialCountdown}
      initialProfile={initialProfile}
    />
  );
}
