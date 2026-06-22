import type { Metadata } from "next";
import { Suspense } from "react";
import LiveExperienceClient from "@/components/experience/live/LiveExperienceClient";
import LightweightLiveLoading from "@/components/live/LightweightLiveLoading";
import { loadTabPageProfile } from "@/lib/experience/load-tab-page-profile";
import { computeCountdown } from "@/lib/live/event-lobby";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "300 Awakening Live | Vital Organs Entertainment",
  description: "Join the 300 Awakening live experience.",
};

/** Attendee live entry — holding room, then Viewer POV when concert begins. Nav hidden on /live. */
export default async function LivePage() {
  const [initialCountdownConfig, initialProfile] = await Promise.all([
    loadActiveCountdownConfig(),
    loadTabPageProfile(),
  ]);
  const initialCountdown = computeCountdown(initialCountdownConfig.start_time);

  return (
    <Suspense fallback={<LightweightLiveLoading />}>
      <LiveExperienceClient
        initialCountdownConfig={initialCountdownConfig}
        initialCountdown={initialCountdown}
        initialProfile={initialProfile}
      />
    </Suspense>
  );
}
