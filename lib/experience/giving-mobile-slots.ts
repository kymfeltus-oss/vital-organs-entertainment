import { MOBILE_ARTBOARD_REF } from "@/lib/responsive";
import { givingAmounts } from "@/lib/vital-seed/giving-assets";

/** Percentage rects aligned to `/public/vital seed/mobile-main-background.png` (1080×1920 stage). */

export type GivingFrequency = "one_time" | "monthly" | "weekly";

export type GivingOverlayRect = {
  left: string;
  top: string;
  width: string;
  height: string;
};

export type GivingPresetSlot = GivingOverlayRect & {
  amount: number;
  label: string;
};

/** Dashboard stage dimensions — same as home. */
export const GIVING_MOBILE_ART = MOBILE_ARTBOARD_REF;

/** Native PNG plate — same 1080×1920 stage as attendee dashboard. */
export const GIVING_MOBILE_ART_NATIVE = MOBILE_ARTBOARD_REF;

export const GIVING_AMOUNT_PRESETS = givingAmounts.map((entry) => entry.amount);

export const GIVING_MOBILE_DEFAULT_AMOUNT = givingAmounts[0].amount;

/** 2×2 preset amount hit targets over baked PNG buttons. */
export const GIVING_MOBILE_PRESET_SLOTS: readonly GivingPresetSlot[] = [
  { amount: 25, label: "SEED", left: "8%", top: "52%", width: "40%", height: "6.8%" },
  { amount: 50, label: "SOW", left: "52%", top: "52%", width: "40%", height: "6.8%" },
  { amount: 100, label: "GROW", left: "8%", top: "59.8%", width: "40%", height: "6.8%" },
  { amount: 250, label: "FLOURISH", left: "52%", top: "59.8%", width: "40%", height: "6.8%" },
];

/** “Custom Amount” field on the PNG plate. */
export const GIVING_MOBILE_CUSTOM_AMOUNT_SLOT: GivingOverlayRect = {
  left: "8%",
  top: "67.2%",
  width: "84%",
  height: "5.5%",
};

export const GIVING_MOBILE_GIVE_NOW_SLOT: GivingOverlayRect = {
  left: "8%",
  top: "73.8%",
  width: "84%",
  height: "6.8%",
};

export const GIVING_MOBILE_ERROR_SLOT: GivingOverlayRect = {
  left: "8%",
  top: "72%",
  width: "84%",
  height: "2.2%",
};

/** Legacy frequency toggles — not on current mobile art; checkout defaults to one-time. */
export const GIVING_MOBILE_FREQUENCY_SLOTS: ReadonlyArray<
  GivingOverlayRect & { frequency: GivingFrequency; label: string }
> = [] as const;
