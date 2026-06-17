import type { Metadata } from "next";
import ViewerPovGoLiveShell from "@/components/experience/live/pov/ViewerPovGoLiveShell";

export const metadata: Metadata = {
  title: "Viewer POV Go Live Preview | 300 Awakening",
  description: "Mock viewer POV layout preview for the 300 Awakening live experience.",
};

/** Isolated visual preview — no stream gate or backend required. */
export default function ViewerPovGoLivePreviewPage() {
  return <ViewerPovGoLiveShell />;
}
