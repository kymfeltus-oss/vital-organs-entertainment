"use client";

import { type CSSProperties } from "react";
import { AWAKENING_ASSETS } from "@/lib/experience/awakening-dashboard-assets";
import { BACKDROP_HEIGHT_SCALE } from "@/lib/experience/dashboard-beam-position";

type ExperienceDashboardBackdropProps = {
  variant: "mobile" | "desktop";
};

export default function ExperienceDashboardBackdrop({
  variant,
}: ExperienceDashboardBackdropProps) {
  const isMobile = variant === "mobile";
  const src = isMobile
    ? AWAKENING_ASSETS.backgrounds.concertMobile
    : AWAKENING_ASSETS.backgrounds.concert;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-brand-black"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        data-backdrop-variant={variant}
        src={src}
        alt=""
        className="experience-dashboard-backdrop-img w-full"
        style={
          {
            "--backdrop-height-scale": BACKDROP_HEIGHT_SCALE,
            objectFit: "cover",
            objectPosition: "center top",
          } as CSSProperties
        }
      />
    </div>
  );
}
