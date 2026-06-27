import type { Metadata } from "next";
import ViewerPovGoLiveGatedClient from "@/components/experience/live/pov/ViewerPovGoLiveGatedClient";
import { loadTabPageProfile } from "@/lib/experience/load-tab-page-profile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Viewer POV Go Live Preview | 300 Awakening",
  description: "Mock viewer POV layout preview for the 300 Awakening live experience.",
};

/** Isolated visual preview — Ian Craig full-page live shell. */
export default async function ViewerPovGoLivePreviewPage() {
  const initialProfile = await loadTabPageProfile();

  return <ViewerPovGoLiveGatedClient initialProfile={initialProfile} />;
}
