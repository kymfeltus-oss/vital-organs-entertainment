import { MOBILE_ARTBOARD_REF } from "@/lib/responsive";

/** Prayer page — mobile-only artboard (no desktop variant). */

export const PRAYER_ASSETS = {
  mobileBackground: "/prayer/prayer.png",
} as const;

export const PRAYER_MOBILE_ART = MOBILE_ARTBOARD_REF;

export const PRAYER_MOBILE_ART_NATIVE = {
  width: 853,
  height: 1844,
} as const;
