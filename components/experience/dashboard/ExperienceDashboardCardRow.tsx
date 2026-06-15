"use client";

import Link from "next/link";
import {
  AWAKENING_DASHBOARD_CARD_ASPECT,
  AWAKENING_DASHBOARD_CARDS,
} from "@/lib/experience/awakening-dashboard-assets";

export default function ExperienceDashboardCardRow() {
  return (
    <div
      className="dashboard-hero-card-row pointer-events-auto"
      style={
        {
          "--dashboard-card-aspect": AWAKENING_DASHBOARD_CARD_ASPECT,
        } as React.CSSProperties
      }
    >
      {AWAKENING_DASHBOARD_CARDS.map((card) => (
        <Link
          key={card.id}
          href={card.href}
          className="dashboard-hero-card-row-link touch-target"
          aria-label={card.label}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.src}
            alt=""
            width={card.width}
            height={card.height}
            decoding="async"
            draggable={false}
            className="dashboard-hero-card-row-img"
          />
        </Link>
      ))}
    </div>
  );
}
