import type { Metadata } from "next";
import PublicCountdownExperience from "@/components/countdown/PublicCountdownExperience";
import { computeCountdown } from "@/lib/live/event-lobby";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";

export const dynamic = "force-dynamic";

import { PLATFORM_APP_NAME } from "@/lib/theme/brand";

export const metadata: Metadata = {
  title: `Countdown | ${PLATFORM_APP_NAME}`,
  description: "Count down to the live experience — synced schedule and event details.",
};

/** Public shareable countdown — rings, schedule copy, and live chat monitor. */
export default async function PublicCountdownPage() {
  const initialConfig = await loadActiveCountdownConfig();
  const initialCountdown = computeCountdown(initialConfig.start_time);

  return (
    <PublicCountdownExperience
      initialConfig={initialConfig}
      initialCountdown={initialCountdown}
      mode="full"
    />
  );
}
