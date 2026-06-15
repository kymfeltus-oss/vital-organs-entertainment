"use client";

import { useLayoutEffect, type RefObject } from "react";

type ExperienceDashboardMobileHeroLayoutProps = {
  spacerRef: RefObject<HTMLDivElement | null>;
};

/** Size the mobile scroll spacer from the rendered backdrop — keeps copy below logo/welcome art. */
export default function ExperienceDashboardMobileHeroLayout({
  spacerRef,
}: ExperienceDashboardMobileHeroLayoutProps) {
  useLayoutEffect(() => {
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      const spacer = spacerRef.current;
      const img = document.querySelector<HTMLImageElement>('[data-backdrop-variant="mobile"]');
      if (!spacer || !img || !img.complete || img.naturalWidth === 0 || img.clientHeight === 0) {
        return;
      }

      const rect = img.getBoundingClientRect();
      /** Baked logo + welcome band occupies ~top 24% of visible mobile plate */
      const logoBandFraction = 0.24;
      const extraClearancePx = 28;
      const spacerHeight = Math.round(rect.top + rect.height * logoBandFraction + extraClearancePx);

      spacer.style.height = `${spacerHeight}px`;
      spacer.dataset.mobileHeroSpaced = "true";
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
  }, [spacerRef]);

  return null;
}
