import type { Metadata } from "next";
import HoldingRoomRouteShell from "@/components/experience/holding-room/HoldingRoomRouteShell";
import { DEFAULT_COUNTDOWN_CONFIG } from "@/lib/live/countdown-config";
import { computeCountdown } from "@/lib/live/event-lobby";
import { buildAttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

/** Dynamic — manifest + env playback resolved per request; no static asset preloads. */
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "300 Awakening Live Holding Room | Vital Organs Entertainment",
  description: "The 300 Awakening live experience holding room.",
};

/** Attendee live entry — publishing is owner-only at /owner/publish/camera. */
export default function LivePage() {
  return (
    <HoldingRoomRouteShell
      initialCountdownConfig={DEFAULT_COUNTDOWN_CONFIG}
      initialCountdown={computeCountdown(DEFAULT_COUNTDOWN_CONFIG.start_time)}
      initialProfile={buildAttendeeProfileSnapshot(null, null)}
    />
  );
}
