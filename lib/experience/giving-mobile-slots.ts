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

/** 2×2 preset amount grid — measured from mobile-main-background.png. */
export const GIVING_MOBILE_AMOUNT_SLOTS: ReadonlyArray<
  GivingOverlayRect & { amount: (typeof GIVING_AMOUNT_PRESETS)[number] }
> = [
  { amount: 25, left: "4.69%", top: "36.23%", width: "44.55%", height: "11.88%" },
  { amount: 50, left: "50.41%", top: "36.23%", width: "44.55%", height: "11.88%" },
  { amount: 100, left: "4.69%", top: "47.99%", width: "44.55%", height: "13.61%" },
  { amount: 250, left: "50.41%", top: "47.99%", width: "44.55%", height: "11.44%" },
];

/** “$ OTHER AMOUNT” field between the grid and Give Now. */
export const GIVING_MOBILE_CUSTOM_AMOUNT_SLOT: GivingOverlayRect = {
  left: "4%",
  top: "61.17%",
  width: "92%",
  height: "6.72%",
};

export const GIVING_MOBILE_GIVE_NOW_SLOT: GivingOverlayRect = {
  left: "4%",
  top: "67.95%",
  width: "92%",
  height: "9.98%",
};

export const GIVING_MOBILE_ERROR_SLOT: GivingOverlayRect = {
  left: "4%",
  top: "65%",
  width: "92%",
  height: "2.5%",
};

/** Legacy frequency toggles — not on current mobile art; checkout defaults to one-time. */
export const GIVING_MOBILE_FREQUENCY_SLOTS: ReadonlyArray<
  GivingOverlayRect & { frequency: GivingFrequency; label: string }
> = [] as const;
