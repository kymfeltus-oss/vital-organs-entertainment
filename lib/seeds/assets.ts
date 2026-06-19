import { MOBILE_ARTBOARD_REF } from "@/lib/responsive";

/** Buy Seeds page — mobile-only artboard (no desktop variant). */

export const BUY_SEEDS_ASSETS = {
  mobileBackground: "/seeds/seeds-coins-background.png?v=1080x1920",
} as const;

export const BUY_SEEDS_MOBILE_ART = MOBILE_ARTBOARD_REF;

/** @deprecated Use BUY_SEEDS_MOBILE_ART */
export const BUY_SEEDS_ART = BUY_SEEDS_MOBILE_ART;
