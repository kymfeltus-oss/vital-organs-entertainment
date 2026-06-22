"use client";

import type { CSSProperties } from "react";
import ViewerPovGoLiveMobile from "@/components/experience/live/pov/ViewerPovGoLiveMobile";
import {
  MOBILE_ARTBOARD_TAB_SHELL,
  MOBILE_ARTBOARD_TAB_STAGE,
  mobileArtboardStageStyle,
} from "@/lib/responsive";

/** Live POV — same mobile artboard track as holding room (/live). */
export default function ViewerPovGoLiveShell() {
  return (
    <main className="live-holding-shell live-pov-root">
      <div className={`live-pov-page ${MOBILE_ARTBOARD_TAB_SHELL}`}>
        <div
          className={`live-pov-page__stage ${MOBILE_ARTBOARD_TAB_STAGE}`}
          style={mobileArtboardStageStyle() as CSSProperties}
        >
          <ViewerPovGoLiveMobile />
        </div>
      </div>
    </main>
  );
}
