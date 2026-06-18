"use client";

import { AWAKENING_ASSETS } from "@/lib/experience/awakening-dashboard-assets";

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
        className="experience-dashboard-backdrop-img experience-dashboard-backdrop-img--mobile"
      />
    </div>
  );
}
