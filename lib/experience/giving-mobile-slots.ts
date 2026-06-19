import { MOBILE_ARTBOARD_REF } from "@/lib/responsive";

/** Percentage hit regions aligned to `/public/vital seed/mobile-main-background.png` (853×1844). */

export type GivingFrequency = "one_time" | "monthly" | "weekly";

export type GivingOverlayRect = {
  left: string;
  top: string;
  width: string;
  height: string;
};

export type GivingCheckSlot = {
  left: string;
  top: string;
  size: string;
};

/** Dashboard stage dimensions — same as home. */
export const GIVING_MOBILE_ART = MOBILE_ARTBOARD_REF;

/** Native PNG plate for art-fit + overlay alignment. */
export const GIVING_MOBILE_ART_NATIVE = {
  width: 853,
  height: 1844,
} as const;

export const GIVING_AMOUNT_PRESETS = [25, 50, 100, 250] as const;

export const GIVING_MOBILE_DEFAULT_AMOUNT = 25 as const;

/** 2×2 preset amount grid — measured from mobile-main-background.png. */
export const GIVING_MOBILE_AMOUNT_SLOTS: ReadonlyArray<
  GivingOverlayRect & {
    amount: (typeof GIVING_AMOUNT_PRESETS)[number];
    check: GivingCheckSlot;
  }
> = [
  {
    amount: 25,
    left: "15.9%",
    top: "33.9%",
    width: "33.9%",
    height: "14.0%",
    check: { left: "19.9%", top: "38.5%", size: "3.2%" },
  },
  {
    amount: 50,
    left: "49.9%",
    top: "33.9%",
    width: "34.5%",
    height: "14.0%",
    check: { left: "53.9%", top: "38.5%", size: "3.2%" },
  },
  {
    amount: 100,
    left: "5.9%",
    top: "46.0%",
    width: "44.0%",
    height: "13.9%",
    check: { left: "9.9%", top: "50.5%", size: "3.2%" },
  },
  {
    amount: 250,
    left: "49.9%",
    top: "46.0%",
    width: "43.6%",
    height: "13.9%",
    check: { left: "53.9%", top: "50.5%", size: "3.2%" },
  },
];

/** “$ OTHER AMOUNT” field between the grid and Give Now. */
export const GIVING_MOBILE_CUSTOM_AMOUNT_SLOT: GivingOverlayRect = {
  left: "5.9%",
  top: "58.0%",
  width: "87.7%",
  height: "8.9%",
};

export const GIVING_MOBILE_GIVE_NOW_SLOT: GivingOverlayRect = {
  left: "6.2%",
  top: "66.0%",
  width: "87.3%",
  height: "11.9%",
};

export const GIVING_MOBILE_ERROR_SLOT: GivingOverlayRect = {
  left: "6.2%",
  top: "63.2%",
  width: "87.3%",
  height: "2.4%",
};

/** Legacy frequency toggles — not on current mobile art; checkout defaults to one-time. */
export const GIVING_MOBILE_FREQUENCY_SLOTS: ReadonlyArray<
  GivingOverlayRect & { frequency: GivingFrequency; label: string }
> = [] as const;
