import type { Metadata } from "next";
import PublicCountdownExperience from "@/components/countdown/PublicCountdownExperience";
import { computeCountdown } from "@/lib/live/event-lobby";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const config = await loadActiveCountdownConfig();
  const title = `${config.headline || "300 Awakening"} — Live Countdown`;
  const description =
    config.subtitle ||
    "Join the 300 Awakening live experience. Count down to go-live with Vital Organs Entertainment.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/** Public shareable countdown — no login, no app nav, synced to /api/countdown. */
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
