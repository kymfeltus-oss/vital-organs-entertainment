"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

type ExperienceDashboardGridCardProps = {
  href: string;
  src: string;
  ariaLabel: string;
  imageVisualScale?: number;
};

/** Square action tile — centered graphic per dashboard-action-grid spec. */
export default function ExperienceDashboardGridCard({
  href,
  src,
  ariaLabel,
  imageVisualScale = 1,
}: ExperienceDashboardGridCardProps) {
  return (
    <Link
      href={href}
      className="dashboard-action-card action-cell experience-dashboard-overlay__card touch-target"
      aria-label={ariaLabel}
      style={
        {
          "--dash-action-art-scale": imageVisualScale,
        } as CSSProperties
      }
    >
      <img
        src={src}
        alt=""
        width={1254}
        height={1254}
        className="main-graphic"
        loading="eager"
        decoding="async"
        draggable={false}
      />
    </Link>
  );
}
