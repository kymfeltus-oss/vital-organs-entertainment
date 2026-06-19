"use client";

import Link from "next/link";

type ExperienceDashboardGridCardProps = {
  href: string;
  src: string;
  ariaLabel: string;
};

/** Square action tile — centered graphic per dashboard-action-grid spec. */
export default function ExperienceDashboardGridCard({
  href,
  src,
  ariaLabel,
}: ExperienceDashboardGridCardProps) {
  return (
    <Link
      href={href}
      className="action-cell experience-dashboard-overlay__card touch-target"
      aria-label={ariaLabel}
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
