/** Percentage hit regions aligned to `/public/vital seed/mobile-main-background.png` (853×1844). */

export type GivingFrequency = "one_time" | "monthly" | "weekly";

export type GivingOverlayRect = {
  left: string;
  top: string;
  width: string;
  height: string;
};

export const GIVING_MOBILE_ART = {
  width: 853,
  height: 1844,
} as const;

export const GIVING_AMOUNT_PRESETS = [25, 50, 100, 250] as const;

/** 2×2 preset amount grid — tuned to baked button art. */
export const GIVING_MOBILE_AMOUNT_SLOTS: ReadonlyArray<
  GivingOverlayRect & { amount: (typeof GIVING_AMOUNT_PRESETS)[number] }
> = [
  { amount: 25, left: "5.5%", top: "39.5%", width: "43%", height: "6.8%" },
  { amount: 50, left: "51.5%", top: "39.5%", width: "43%", height: "6.8%" },
  { amount: 100, left: "5.5%", top: "47.8%", width: "43%", height: "6.8%" },
  { amount: 250, left: "51.5%", top: "47.8%", width: "43%", height: "6.8%" },
];

/** “$ OTHER AMOUNT” field between the grid and Give Now. */
export const GIVING_MOBILE_CUSTOM_AMOUNT_SLOT: GivingOverlayRect = {
  left: "5.5%",
  top: "56.5%",
  width: "89%",
  height: "5.5%",
};

export const GIVING_MOBILE_GIVE_NOW_SLOT: GivingOverlayRect = {
  left: "5.5%",
  top: "63.5%",
  width: "89%",
  height: "7.5%",
};

export const GIVING_MOBILE_ERROR_SLOT: GivingOverlayRect = {
  left: "5.5%",
  top: "61.5%",
  width: "89%",
  height: "2%",
};

/** Legacy frequency toggles — not on current mobile art; checkout defaults to one-time. */
export const GIVING_MOBILE_FREQUENCY_SLOTS: ReadonlyArray<
  GivingOverlayRect & { frequency: GivingFrequency; label: string }
> = [] as const;
