"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import {
  AWAKENING_DASHBOARD_CARD_ASPECT,
  AWAKENING_DASHBOARD_CARDS,
} from "@/lib/experience/awakening-dashboard-assets";
import { concertCardRowTopFromBackdropImg } from "@/lib/experience/dashboard-beam-position";

/** Invisible tap targets over baked-in card art on the mobile backdrop PNG. */
export default function ExperienceDashboardMobileCardHits() {
  const rowRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      const row = rowRef.current;
      const backdropImg = document.querySelector<HTMLImageElement>(
        '[data-backdrop-variant="mobile"]',
      );
      if (!row || !backdropImg || !backdropImg.complete || backdropImg.naturalWidth === 0) {
        return;
      }

      const cardRowTop = concertCardRowTopFromBackdropImg(backdropImg, "mobile");
      if (cardRowTop <= 0) return;

      const rowHeight = row.offsetHeight;
      const topPx = Math.round(cardRowTop - rowHeight * 0.12);

      row.style.setProperty("top", `${topPx}px`, "important");
      row.dataset.cardHitsMeasured = "true";
    };

    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    const backdropImg = document.querySelector<HTMLImageElement>(
      '[data-backdrop-variant="mobile"]',
    );
    backdropImg?.addEventListener("load", measure);
    measure();

    const observer =
      rowRef.current && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => measure())
        : null;
    if (rowRef.current && observer) {
      observer.observe(rowRef.current);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      backdropImg?.removeEventListener("load", measure);
      observer?.disconnect();
    };
  }, []);

  return (
    <div
      ref={rowRef}
      className="dashboard-hero-mobile-card-hits pointer-events-auto"
      style={{ "--dashboard-card-aspect": AWAKENING_DASHBOARD_CARD_ASPECT } as React.CSSProperties}
      aria-label="Dashboard shortcuts"
    >
      {AWAKENING_DASHBOARD_CARDS.map((card) => (
        <Link
          key={card.id}
          href={card.href}
          className="dashboard-hero-mobile-card-hit touch-target"
          aria-label={card.label}
        />
      ))}
    </div>
  );
}
