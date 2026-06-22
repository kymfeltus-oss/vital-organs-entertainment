import { MOBILE_ARTBOARD_REF } from "@/lib/responsive";

/** Vital Seed giving background plates (`/public/images/vital-seed/`). */

export const VITAL_SEED_GIVING_ASSET_VERSION = "20260612";

export const VITAL_SEED_GIVING_ASSETS = {
  desktopBackground: "/images/vital-seed/desktop-background.png",
  mobileBackground: `/vital seed/mobile-main-background.png?v=${VITAL_SEED_GIVING_ASSET_VERSION}`,
} as const;

export const VITAL_SEED_GIVING_DESKTOP_ART = {
  width: 1536,
  height: 1024,
} as const;

export const VITAL_SEED_GIVING_MOBILE_ART = MOBILE_ARTBOARD_REF;

/** Native mobile plate (941×1672) — top-aligned on the 1080×1920 stage. */
export const VITAL_SEED_GIVING_MOBILE_ART_NATIVE = {
  width: 941,
  height: 1672,
} as const;

/** Top crop of mobile-main-background.png — logo + tagline (excludes baked form). */
export const VITAL_SEED_GIVING_HERO_CROP_RATIO = 0.34;

/** Preset gift amounts — rendered as native text over empty grid slots on mobile-main-background.png. */
export const givingAmounts = [
  {
    amount: 25,
    label: "SEED",
  },
  {
    amount: 50,
    label: "SOW",
  },
  {
    amount: 100,
    label: "GROW",
  },
  {
    amount: 250,
    label: "FLOURISH",
  },
] as const;

export type GivingAmountCard = (typeof givingAmounts)[number];

/** @deprecated Use givingAmounts */
export const GIVING_AMOUNTS = givingAmounts;
