import type { Metadata } from "next";
import PublicCountdownExperience from "@/components/countdown/PublicCountdownExperience";
import { computeCountdown } from "@/lib/live/event-lobby";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "300 Awakening Countdown | Vital Organs Entertainment",
  description: "Count down to the 300 Awakening live experience with the synchronized event schedule.",
};

/** Public shareable neon countdown synchronized to the live event schedule. */
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
