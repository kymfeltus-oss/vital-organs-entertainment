"use client";

import { useLayoutEffect, type RefObject } from "react";

type ExperienceDashboardMobileHeroLayoutProps = {
  headlineBlockRef: RefObject<HTMLDivElement | null>;
};

/** Pin mobile hero copy below the backdrop logo band — fixed viewport, no scroll. */
export default function ExperienceDashboardMobileHeroLayout({
  headlineBlockRef,
}: ExperienceDashboardMobileHeroLayoutProps) {
  useLayoutEffect(() => {
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      const block = headlineBlockRef.current;
      const img = document.querySelector<HTMLImageElement>('[data-backdrop-variant="mobile"]');
      if (!block || !img || !img.complete || img.naturalWidth === 0 || img.clientHeight === 0) {
        return;
      }

      const rect = img.getBoundingClientRect();
      const logoBandFraction = 0.24;
      const extraClearancePx = 28;
      const topPx = Math.round(rect.top + rect.height * logoBandFraction + extraClearancePx);

      block.style.setProperty("position", "absolute", "important");
      block.style.setProperty("top", `${topPx}px`, "important");
      block.style.setProperty("left", "50%", "important");
      block.style.setProperty("transform", "translate3d(-50%, 0, 0)", "important");
      block.style.setProperty("width", "100%", "important");
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
