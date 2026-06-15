"use client";

// @refresh reset — layout module: remount on edit instead of reusing stale hook state.
import { useLayoutEffect, type RefObject } from "react";
import {
  concertHeroStackAnchorTopFromBackdropImg,
  dashboardHeroStackTopPx,
  HERO_STACK_LAYOUT_VERSION,
  normalizeBackdropVariant,
  resolveActiveBackdropVariant,
  type BackdropVariant,
} from "@/lib/experience/dashboard-beam-position";

type HeroMeasurerProps = {
  variant: "mobile" | "desktop" | undefined;
  headlineBlockRef: RefObject<HTMLDivElement | null>;
  ctaRef: RefObject<HTMLDivElement | null>;
};

function areCtaImagesReady(ctaEl: HTMLElement): boolean {
  const imgs = ctaEl.querySelectorAll("img");
  return (
    imgs.length >= 2 &&
    Array.from(imgs).every((img) => img.complete && img.naturalHeight > 0)
  );
}

function isCardRowReady(blockEl: HTMLElement): boolean {
  const cardRow = blockEl.querySelector(".dashboard-hero-card-row");
  const imgs = cardRow?.querySelectorAll<HTMLImageElement>(
    ".dashboard-hero-card-row-img",
  );
  return (
    imgs != null &&
    imgs.length >= 4 &&
    Array.from(imgs).every((img) => img.complete && img.naturalHeight > 0) &&
    (cardRow?.getBoundingClientRect().height ?? 0) > 0
  );
}

function areFontsReady(): boolean {
  return document.fonts?.status === "loaded";
}

function applyHeadlineBlockPosition(blockEl: HTMLElement, blockTopViewport: number) {
  const heroSection = blockEl.closest<HTMLElement>(".dashboard-hero");
  const heroTop = heroSection?.getBoundingClientRect().top ?? 0;
  const blockTopInHero = Math.round(blockTopViewport - heroTop);

  blockEl.style.setProperty("top", `${blockTopInHero}px`, "important");
  blockEl.style.setProperty("left", "50%", "important");
  blockEl.style.setProperty("transform", "translate3d(-50%, 0, 0)", "important");
}

/** Fixed 4-slot deps — never change array length (React Fast Refresh requirement). */
const LAYOUT_EFFECT_SLOT_4 = 0 as const;

export default function ExperienceDashboardHeroMeasurer({
  variant,
  headlineBlockRef,
  ctaRef,
}: HeroMeasurerProps) {
  const backdropVariant = normalizeBackdropVariant(variant);

  useLayoutEffect(() => {
    const activeVariantRef = { current: resolveActiveBackdropVariant() as BackdropVariant };
    const lastTopRef = { current: null as number | null };
    const lastViewportRef = { current: null as { vw: number; vh: number } | null };
    const hasLockedMeasureRef = { current: false };

    activeVariantRef.current = resolveActiveBackdropVariant();

    const mq = window.matchMedia("(min-width: 768px)");
    const onBreakpointChange = () => {
      activeVariantRef.current = resolveActiveBackdropVariant();
      hasLockedMeasureRef.current = false;
      window.dispatchEvent(new Event("resize"));
    };
    mq.addEventListener("change", onBreakpointChange);

    let cancelled = false;

    const measure = (reason: string) => {
      if (cancelled || backdropVariant !== activeVariantRef.current) return false;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const prevViewport = lastViewportRef.current;
      const viewportUnchanged =
        prevViewport != null && prevViewport.vw === vw && prevViewport.vh === vh;

      if (hasLockedMeasureRef.current) {
        if (reason !== "resize" || viewportUnchanged) return false;
        hasLockedMeasureRef.current = false;
      }

      const blockEl = headlineBlockRef.current;
      const ctaEl = ctaRef.current;
      if (!blockEl || !ctaEl) return false;

      const backdropImg = document.querySelector<HTMLImageElement>(
        `[data-backdrop-variant="${backdropVariant}"]`,
      );

      const backdropReady =
        backdropImg != null &&
        backdropImg.complete &&
        backdropImg.naturalWidth > 0 &&
        backdropImg.clientWidth > 0 &&
        backdropImg.clientHeight > 0;

      const ctasReady = areCtaImagesReady(ctaEl);
      const cardsReady =
        backdropVariant === "mobile" ? true : isCardRowReady(blockEl);
      const fontsReady = areFontsReady();

      if (!backdropReady || !ctasReady || !cardsReady || !fontsReady) return false;

      const anchorTop = concertHeroStackAnchorTopFromBackdropImg(
        backdropImg,
        backdropVariant,
      );

      if (anchorTop <= 0) return false;

      const copyStackEl = blockEl.querySelector(".dashboard-hero-copy-stack");
      const stackHeight =
        copyStackEl?.getBoundingClientRect().height ??
        ctaEl.getBoundingClientRect().height;

      const desiredTop = dashboardHeroStackTopPx(anchorTop, backdropVariant);
      const minBlockTop = backdropVariant === "mobile" ? 76 : 124;
      const bottomInset = backdropVariant === "mobile" ? 28 : 20;
      let blockTop = desiredTop;
      let liftedTop = desiredTop;

      const projectedStackBottom = desiredTop + stackHeight;
      const viewportOverflow = projectedStackBottom - (vh - bottomInset);

      if (viewportOverflow > 0) {
        liftedTop = desiredTop - viewportOverflow;
        blockTop = Math.max(liftedTop, minBlockTop);
      }

      const prevTop = lastTopRef.current;

      if (prevTop != null && blockTop > prevTop && viewportUnchanged) {
        blockTop = prevTop;
      }

      applyHeadlineBlockPosition(blockEl, blockTop);
      blockEl.dataset.heroMeasured = "true";
      lastTopRef.current = blockTop;
      lastViewportRef.current = { vw, vh };
      hasLockedMeasureRef.current = true;

      return true;
    };

    const tryMeasure = (reason: string) => {
      if (areFontsReady()) {
        measure(reason);
        return;
      }
      void document.fonts?.ready?.then(() => {
        if (!cancelled) measure(reason);
      });
    };

    tryMeasure("layout");

    const onResize = () => tryMeasure("resize");
    window.addEventListener("resize", onResize);

    const backdropImg = document.querySelector<HTMLImageElement>(
      `[data-backdrop-variant="${backdropVariant}"]`,
    );
    const onBackdropLoad = () => tryMeasure("backdrop-load");
    backdropImg?.addEventListener("load", onBackdropLoad);

    const ctaEl = ctaRef.current;
    const ctaImgs = ctaEl?.querySelectorAll("img") ?? [];
    const onCtaLoad = () => tryMeasure("cta-load");
    ctaImgs.forEach((img) => img.addEventListener("load", onCtaLoad));

    const blockEl = headlineBlockRef.current;
    const onCardsReady = () => tryMeasure("cards-ready");
    const cardRow = blockEl?.querySelector(".dashboard-hero-card-row");
    const cardImgs = cardRow?.querySelectorAll<HTMLImageElement>(
      ".dashboard-hero-card-row-img",
    );
    const cardObserver =
      cardRow && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => onCardsReady())
        : null;
    if (cardRow && cardObserver) {
      cardObserver.observe(cardRow);
      cardImgs?.forEach((img) => img.addEventListener("load", onCardsReady));
      onCardsReady();
    }

    void document.fonts?.ready?.then(() => {
      if (!cancelled) tryMeasure("fonts-ready");
    });

    return () => {
      cancelled = true;
      mq.removeEventListener("change", onBreakpointChange);
      window.removeEventListener("resize", onResize);
      backdropImg?.removeEventListener("load", onBackdropLoad);
      ctaImgs.forEach((img) => img.removeEventListener("load", onCtaLoad));
      cardImgs?.forEach((img) => img.removeEventListener("load", onCardsReady));
      cardObserver?.disconnect();
    };
  }, [variant, backdropVariant, HERO_STACK_LAYOUT_VERSION, LAYOUT_EFFECT_SLOT_4]);

  return null;
}
