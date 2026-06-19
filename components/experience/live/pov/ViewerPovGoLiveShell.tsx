"use client";

import ViewerPovGoLiveMobile from "@/components/experience/live/pov/ViewerPovGoLiveMobile";

/** Mobile artboard POV shell — capped to `--mobile-app-track-w`, no desktop variant. */
export default function ViewerPovGoLiveShell() {
  return (
    <div className="live-pov-page">
      <div className="live-pov-page__stage">
        <ViewerPovGoLiveMobile />
      </div>
    </div>
  );
}
