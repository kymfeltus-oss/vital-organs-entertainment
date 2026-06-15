"use client";

import { AWAKENING_ASSETS } from "@/lib/experience/awakening-dashboard-assets";
import { cn } from "@/lib/utils";

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
        className={cn(
          "experience-dashboard-backdrop-img",
          isMobile
            ? "experience-dashboard-backdrop-img--mobile"
            : "experience-dashboard-backdrop-img--desktop",
        )}
      />
    </div>
  );
}
