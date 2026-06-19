"use client";

import ViewerPovGoLiveMobile from "@/components/experience/live/pov/ViewerPovGoLiveMobile";

/** Full-viewport immersive POV shell — mobile layout only, no desktop variant. */
export default function ViewerPovGoLiveShell() {
  return (
    <div className="fixed inset-0 z-[100] h-dvh w-full overflow-hidden bg-brand-black">
      <ViewerPovGoLiveMobile />
    </div>
  );
}
