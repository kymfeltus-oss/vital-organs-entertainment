"use client";

import { AWAKENING_ASSETS } from "@/lib/experience/awakening-dashboard-assets";

type ExperienceDashboardBackdropProps = {
  variant: "mobile" | "desktop";
};

export default function ExperienceDashboardBackdrop({
  variant: _variant,
}: ExperienceDashboardBackdropProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-brand-black"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={AWAKENING_ASSETS.backgrounds.concert}
        alt=""
        className="h-full w-full object-contain object-center"
      />
    </div>
  );
}
