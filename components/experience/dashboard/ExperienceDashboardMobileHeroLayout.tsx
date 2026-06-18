"use client";

import {
  concertCardRowTopFromBackdropImg,
  concertHeroStackAnchorTopFromBackdropImg,
  dashboardHeroStackTopPx,
} from "@/lib/experience/dashboard-beam-position";
import { useLayoutEffect, type RefObject } from "react";

type ExperienceDashboardMobileHeroLayoutProps = {
  headlineBlockRef: RefObject<HTMLDivElement | null>;
};

/** Pin hero + card hits to normalized rows on the fill-fit backdrop plate. */
export default function ExperienceDashboardMobileHeroLayout({
  headlineBlockRef,
}: ExperienceDashboardMobileHeroLayoutProps) {
  useLayoutEffect(() => {
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      const block = headlineBlockRef.current;
      const shell = document.querySelector<HTMLElement>('[data-dashboard-shell="mobile"]');
      const img = document.querySelector<HTMLImageElement>('[data-backdrop-variant="mobile"]');
      if (!block || !shell || !img || !img.complete || img.naturalWidth === 0 || img.clientHeight === 0) {
        return;
      }

      const heroTopPx = dashboardHeroStackTopPx(concertHeroStackAnchorTopFromBackdropImg(img));
      const cardRowTopPx = Math.round(concertCardRowTopFromBackdropImg(img));

      shell.style.setProperty("--dash-backdrop-hero-top", `${heroTopPx}px`);
      shell.style.setProperty("--dash-backdrop-card-row-top", `${cardRowTopPx}px`);

      block.dataset.mobileHeroPlaced = "true";
    };

    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    const img = document.querySelector<HTMLImageElement>('[data-backdrop-variant="mobile"]');
    const onLoad = () => measure();
    img?.addEventListener("load", onLoad);

    measure();
    requestAnimationFrame(() => measure());

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      img?.removeEventListener("load", onLoad);
    };
  }, [headlineBlockRef]);

  return null;
}
