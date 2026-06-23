import type { Metadata } from "next";
import ViewerPovGoLiveGatedClient from "@/components/experience/live/pov/ViewerPovGoLiveGatedClient";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";
import { loadTabPageProfile } from "@/lib/experience/load-tab-page-profile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Viewer POV Go Live Preview | 300 Awakening",
  description: "Mock viewer POV layout preview for the 300 Awakening live experience.",
};

/** Isolated visual preview — profile orb + live viewer count; sign in for full profile. */
export default async function ViewerPovGoLivePreviewPage() {
  const [initialProfile, initialCountdownConfig] = await Promise.all([
    loadTabPageProfile(),
    loadActiveCountdownConfig(),
  ]);

  return (
    <ViewerPovGoLiveGatedClient
      initialProfile={initialProfile}
      initialCountdownConfig={initialCountdownConfig}
    />
  );
}
