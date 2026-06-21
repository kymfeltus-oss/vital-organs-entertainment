import type { Metadata } from "next";
import { Suspense } from "react";
import LiveExperienceClient from "@/components/experience/live/LiveExperienceClient";
import LightweightLiveLoading from "@/components/live/LightweightLiveLoading";
import { loadTabPageProfile } from "@/lib/experience/load-tab-page-profile";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";

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

  return (
    <Suspense fallback={<LightweightLiveLoading />}>
      <LiveExperienceClient
        initialCountdownConfig={initialCountdownConfig}
        initialProfile={initialProfile}
      />
    </Suspense>
  );
}
