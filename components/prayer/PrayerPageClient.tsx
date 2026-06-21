"use client";

import type { CSSProperties } from "react";
import PrayerOverlay from "@/components/prayer/PrayerOverlay";
import { PRAYER_ASSETS, PRAYER_MOBILE_ART_NATIVE } from "@/lib/prayer/assets";
import {
  MOBILE_ARTBOARD_ART_FIT,
  MOBILE_ARTBOARD_STAGE,
  MOBILE_ARTBOARD_TAB_SHELL,
  mobileArtboardStageStyle,
} from "@/lib/responsive";

export default function PrayerPageClient() {
  return (
    <div className={`prayer-page ${MOBILE_ARTBOARD_TAB_SHELL}`}>
      <div
        className={`prayer-page__stage ${MOBILE_ARTBOARD_STAGE}`}
        style={mobileArtboardStageStyle({ native: PRAYER_MOBILE_ART_NATIVE }) as CSSProperties}
      >
        <div className={MOBILE_ARTBOARD_ART_FIT}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PRAYER_ASSETS.mobileBackground}
            alt="Prayer — We'd love to pray with you"
            width={PRAYER_MOBILE_ART_NATIVE.width}
            height={PRAYER_MOBILE_ART_NATIVE.height}
            className="prayer-page__bg"
            loading="eager"
            decoding="async"
            draggable={false}
          />
          <PrayerOverlay />
        </div>
      </div>
    </div>
  );
}
