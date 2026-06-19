"use client";

import type { CSSProperties } from "react";
import PrayerOverlay from "@/components/prayer/PrayerOverlay";
import { PRAYER_ASSETS, PRAYER_MOBILE_ART } from "@/lib/prayer/assets";

export default function PrayerPageClient() {
  return (
    <div className="prayer-page">
      <div
        className="prayer-page__stage"
        style={
          {
            "--prayer-art-w": PRAYER_MOBILE_ART.width,
            "--prayer-art-h": PRAYER_MOBILE_ART.height,
          } as CSSProperties
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PRAYER_ASSETS.mobileBackground}
          alt="Prayer — We'd love to pray with you"
          width={PRAYER_MOBILE_ART.width}
          height={PRAYER_MOBILE_ART.height}
          className="prayer-page__bg"
          loading="eager"
          decoding="async"
          draggable={false}
        />
        <PrayerOverlay />
      </div>
    </div>
  );
}
