"use client";

import type { CSSProperties } from "react";
import ViewerPovGoLiveMobile from "@/components/experience/live/pov/ViewerPovGoLiveMobile";
import {
  MOBILE_ARTBOARD_FULL_SHELL,
  MOBILE_ARTBOARD_STAGE,
  mobileArtboardStageStyle,
} from "@/lib/responsive";

/** Mobile artboard POV shell — capped to `--mobile-app-track-w`, no desktop variant. */
export default function ViewerPovGoLiveShell() {
  return (
    <div className={`live-pov-page ${MOBILE_ARTBOARD_FULL_SHELL}`}>
      <div
        className={`live-pov-page__stage ${MOBILE_ARTBOARD_STAGE}`}
        style={mobileArtboardStageStyle() as CSSProperties}
      >
        <ViewerPovGoLiveMobile />
      </div>
    </div>
  );
}
