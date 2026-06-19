"use client";

import ViewerPovGoLiveDesktop from "@/components/experience/live/pov/ViewerPovGoLiveDesktop";
import ViewerPovGoLiveMobile from "@/components/experience/live/pov/ViewerPovGoLiveMobile";

/** Full-viewport immersive POV shell — no legacy chrome or nav. */
export default function ViewerPovGoLiveShell() {
  return (
    <div className="fixed inset-0 z-[100] h-dvh w-full overflow-hidden bg-brand-black">
      <div className="h-full w-full md:hidden">
        <ViewerPovGoLiveMobile />
      </div>
      <div className="hidden h-full w-full md:block">
        <ViewerPovGoLiveDesktop />
      </div>
    </div>
  );
}
