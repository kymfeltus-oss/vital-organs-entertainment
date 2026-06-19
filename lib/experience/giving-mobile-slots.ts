/** Percentage hit regions aligned to `/public/vital seed/mobile-main-background.png` (941×1672). */

export type GivingFrequency = "one_time" | "monthly" | "weekly";

export type GivingOverlayRect = {
  left: string;
  top: string;
  width: string;
  height: string;
};

export const GIVING_MOBILE_ART = {
  width: 941,
  height: 1672,
} as const;

export const GIVING_AMOUNT_PRESETS = [25, 50, 100, 250, 500, 1000] as const;

/** 3×2 preset amount grid — tuned to baked button art. */
export const GIVING_MOBILE_AMOUNT_SLOTS: ReadonlyArray<
  GivingOverlayRect & { amount: (typeof GIVING_AMOUNT_PRESETS)[number] }
> = [
  { amount: 25, left: "7.5%", top: "38.1%", width: "26%", height: "7.1%" },
  { amount: 50, left: "37%", top: "38.1%", width: "26%", height: "7.1%" },
  { amount: 100, left: "66.5%", top: "38.1%", width: "26%", height: "7.1%" },
  { amount: 250, left: "7.5%", top: "46.8%", width: "26%", height: "7.1%" },
  { amount: 500, left: "37%", top: "46.8%", width: "26%", height: "7.1%" },
  { amount: 1000, left: "66.5%", top: "46.8%", width: "26%", height: "7.1%" },
];

/** Center field between baked $ divider and USD label. */
export const GIVING_MOBILE_CUSTOM_AMOUNT_SLOT: GivingOverlayRect = {
  left: "19%",
  top: "57.6%",
  width: "58%",
  height: "5.2%",
};

export const GIVING_MOBILE_FREQUENCY_SLOTS: ReadonlyArray<
  GivingOverlayRect & { frequency: GivingFrequency; label: string }
> = [
  {
    frequency: "one_time",
    label: "Select one-time giving",
    left: "7.5%",
    top: "68.4%",
    width: "26%",
    height: "4.6%",
  },
  {
    frequency: "monthly",
    label: "Select monthly giving",
    left: "37%",
    top: "68.4%",
    width: "26%",
    height: "4.6%",
  },
  {
    frequency: "weekly",
    label: "Select weekly giving",
    left: "66.5%",
    top: "68.4%",
    width: "26%",
    height: "4.6%",
  },
];

export const GIVING_MOBILE_GIVE_NOW_SLOT: GivingOverlayRect = {
  left: "7.5%",
  top: "75.4%",
  width: "85%",
  height: "8.2%",
};

export const GIVING_MOBILE_ERROR_SLOT: GivingOverlayRect = {
  left: "7.5%",
  top: "73.2%",
  width: "85%",
  height: "2.4%",
};
