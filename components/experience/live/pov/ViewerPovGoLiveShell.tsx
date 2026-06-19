"use client";

import type { CSSProperties } from "react";
import ViewerPovGoLiveMobile from "@/components/experience/live/pov/ViewerPovGoLiveMobile";
import { mobileArtboardStageStyle } from "@/lib/responsive";

/** Mobile artboard POV shell — capped to `--mobile-app-track-w`, no desktop variant. */
export default function ViewerPovGoLiveShell() {
  return (
    <div className="live-pov-page">
      <div
        className="live-pov-page__stage"
        style={mobileArtboardStageStyle() as CSSProperties}
      >
        <ViewerPovGoLiveMobile />
      </div>
    </div>
  );
}
