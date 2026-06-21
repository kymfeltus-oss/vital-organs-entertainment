import { MOBILE_ARTBOARD_REF } from "@/lib/responsive";
import { givingAmounts } from "@/lib/vital-seed/giving-assets";

/** Percentage rects aligned to `/public/vital seed/mobile-main-background.png` (853×1844). */

export type GivingFrequency = "one_time" | "monthly" | "weekly";

export type GivingOverlayRect = {
  left: string;
  top: string;
  width: string;
  height: string;
};

/** Dashboard stage dimensions — same as home. */
export const GIVING_MOBILE_ART = MOBILE_ARTBOARD_REF;

/** Native PNG plate for art-fit + overlay alignment. */
export const GIVING_MOBILE_ART_NATIVE = {
  width: 853,
  height: 1844,
} as const;

export const GIVING_AMOUNT_PRESETS = givingAmounts.map((entry) => entry.amount);

export const GIVING_MOBILE_DEFAULT_AMOUNT = givingAmounts[0].amount;

/** Black mask — hides baked mission body copy + baked “Choose an amount” label on PNG. */
export const GIVING_MOBILE_BODY_COPY_MASK: GivingOverlayRect = {
  left: "0%",
  top: "40%",
  width: "100%",
  height: "14.5%",
};

/** Black mask — hides baked grid, custom field, and Give Now art (through ~92%). */
export const GIVING_MOBILE_BAKED_CONTROLS_MASK: GivingOverlayRect = {
  left: "0%",
  top: "47.5%",
  width: "100%",
  height: "44%",
};

/** Native grid panel — covers baked "CHOOSE AN AMOUNT" + 2×2 preset boxes only. */
export const GIVING_MOBILE_GRID_PANEL: GivingOverlayRect = {
  left: "0%",
  top: "47.5%",
  width: "100%",
  height: "23%",
};

/** @deprecated Use GIVING_MOBILE_BAKED_CONTROLS_MASK / GIVING_MOBILE_GRID_PANEL */
export const GIVING_MOBILE_AMOUNT_PANEL = GIVING_MOBILE_BAKED_CONTROLS_MASK;

/** “$ OTHER AMOUNT” field between the grid and Give Now. */
export const GIVING_MOBILE_CUSTOM_AMOUNT_SLOT: GivingOverlayRect = {
  left: "7.6%",
  top: "70.7%",
  width: "84.4%",
  height: "5.5%",
};

export const GIVING_MOBILE_GIVE_NOW_SLOT: GivingOverlayRect = {
  left: "7.6%",
  top: "77.9%",
  width: "84.4%",
  height: "6.8%",
};

export const GIVING_MOBILE_ERROR_SLOT: GivingOverlayRect = {
  left: "7.6%",
  top: "76.5%",
  width: "84.4%",
  height: "2.2%",
};

/** Legacy frequency toggles — not on current mobile art; checkout defaults to one-time. */
export const GIVING_MOBILE_FREQUENCY_SLOTS: ReadonlyArray<
  GivingOverlayRect & { frequency: GivingFrequency; label: string }
> = [] as const;
