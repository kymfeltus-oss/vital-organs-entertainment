import type { Metadata } from "next";
import { Suspense } from "react";
import LiveExperienceClient from "@/components/experience/live/LiveExperienceClient";
import LightweightLiveLoading from "@/components/live/LightweightLiveLoading";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";

export const metadata: Metadata = {
  title: "300 Awakening Live Experience | Vital Organs Entertainment",
  description:
    "Join the 300 Awakening Live Experience — premium live viewing from Vital Organs Entertainment.",
};

/**
 * Attendee live experience — Vital Organs Entertainment.
 * Reads live state via existing access API + Supabase realtime.
 */
export default async function ExperienceLivePage() {
  const initialCountdownConfig = await loadActiveCountdownConfig();

  return (
    <Suspense fallback={<LightweightLiveLoading />}>
      <LiveExperienceClient initialCountdownConfig={initialCountdownConfig} />
    </Suspense>
  );
}
