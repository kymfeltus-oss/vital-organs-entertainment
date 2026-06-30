import type { Metadata } from "next";
import ExperienceHoldingRoomPageClient from "@/components/experience/holding-room/ExperienceHoldingRoomPageClient";
import { loadTabPageProfile } from "@/lib/experience/load-tab-page-profile";
import { DEFAULT_COUNTDOWN_CONFIG } from "@/lib/live/countdown-config";
import { computeCountdown } from "@/lib/live/event-lobby";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "300 Awakening Holding Room | Vital Organs Entertainment",
  description: "Prepare for the 300 Awakening live experience in the synchronized holding room.",
};

/**
 * Original PNG-based pre-live holding room.
 *
 * Loads the shared attendee profile snapshot so the header/profile orb behaves
 * like Music, Giving, Buy Seeds, and the other artboard tabs.
 */
export default async function ExperienceHoldingRoomPage() {
  const initialProfile = await loadTabPageProfile();
  const initialCountdown = computeCountdown(DEFAULT_COUNTDOWN_CONFIG.start_time);

  return (
    <ExperienceHoldingRoomPageClient
      initialCountdownConfig={DEFAULT_COUNTDOWN_CONFIG}
      initialCountdown={initialCountdown}
      initialProfile={initialProfile}
    />
  );
}
