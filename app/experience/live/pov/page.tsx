import type { Metadata } from "next";
import ViewerPovGoLiveGatedClient from "@/components/features/live/pov/ViewerPovGoLiveGatedClient";
import { loadTabPageProfile } from "@/lib/experience/load-tab-page-profile";
import { PLATFORM_APP_NAME } from "@/lib/theme/brand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Viewer POV Preview | ${PLATFORM_APP_NAME}`,
  description: `Mock viewer POV layout preview for ${PLATFORM_APP_NAME}.`,
};

/** Isolated visual preview — Ian Craig full-page live shell. */
export default async function ViewerPovGoLivePreviewPage() {
  const initialProfile = await loadTabPageProfile();

  return <ViewerPovGoLiveGatedClient initialProfile={initialProfile} />;
}
