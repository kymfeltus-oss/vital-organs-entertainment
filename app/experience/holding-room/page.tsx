import type { Metadata } from "next";
import ExperienceHoldingRoomPageClient from "@/components/experience/holding-room/ExperienceHoldingRoomPageClient";
import { DEFAULT_COUNTDOWN_CONFIG } from "@/lib/live/countdown-config";
import { computeCountdown } from "@/lib/live/event-lobby";
import { buildAttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "300 Awakening Holding Room | Vital Organs Entertainment",
  description: "Prepare for the 300 Awakening live experience in the synchronized holding room.",
};

/**
 * Original PNG-based pre-live holding room.
 *
 * Keep this route render-fast: it must not block first paint on Supabase/auth reads.
 * The client countdown hook immediately syncs the saved owner show settings from `/api/countdown`.
 */
export default function ExperienceHoldingRoomPage() {
  const initialProfile = buildAttendeeProfileSnapshot(null, null);
  const initialCountdown = computeCountdown(DEFAULT_COUNTDOWN_CONFIG.start_time);

  return (
    <ExperienceHoldingRoomPageClient
      initialCountdownConfig={DEFAULT_COUNTDOWN_CONFIG}
      initialCountdown={initialCountdown}
      initialProfile={initialProfile}
    />
  );
}
