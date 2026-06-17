"use client";

import ViewerPovGoLiveDesktop from "@/components/experience/live/pov/ViewerPovGoLiveDesktop";
import ViewerPovGoLiveMobile from "@/components/experience/live/pov/ViewerPovGoLiveMobile";

/** Responsive shell — mobile immersive POV below md, split dashboard at md+. */
export default function ViewerPovGoLiveShell() {
  return (
    <>
      <div className="block md:hidden">
        <ViewerPovGoLiveMobile />
      </div>
      <div className="hidden md:block">
        <ViewerPovGoLiveDesktop />
      </div>
    </>
  );
}
