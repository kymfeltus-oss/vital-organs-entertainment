"use client";

import {
  AWAKENING_ASSETS,
  AWAKENING_CONCERT_BACKDROP_ART,
} from "@/lib/experience/awakening-dashboard-assets";

export default function ExperienceDashboardBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-brand-black"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        data-backdrop-variant="mobile"
        src={AWAKENING_ASSETS.background}
        alt=""
        width={AWAKENING_CONCERT_BACKDROP_ART.width}
        height={AWAKENING_CONCERT_BACKDROP_ART.height}
        className="experience-dashboard-backdrop-img experience-dashboard-backdrop-img--mobile"
      />
    </div>
  );
}
