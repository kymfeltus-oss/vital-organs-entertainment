import { MOBILE_ARTBOARD_REF } from "@/lib/responsive";
import { givingAmounts, type GivingAmountCard } from "@/lib/vital-seed/giving-assets";

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

export type GivingMobileAmountCard = GivingAmountCard &
  GivingOverlayRect & {
    check: GivingCheckSlot;
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

/** Empty grid cells on mobile-main-background.png (853×1844). */
const GIVING_GRID_COL_LEFT = "8.0%";
const GIVING_GRID_COL_RIGHT = "53.9%";
const GIVING_GRID_COL_WIDTH = "37.9%";
/** Equal row height — split measured grid band (55.1%–78.1%) minus inter-row gap. */
const GIVING_GRID_ROW_HEIGHT = "10.9%";
const GIVING_GRID_ROW1_TOP = "55.1%";
const GIVING_GRID_ROW2_TOP = "67.2%";

const GIVING_MOBILE_AMOUNT_SLOT_LAYOUT: Record<
  GivingAmountCard["amount"],
  GivingOverlayRect & { check: GivingCheckSlot }
> = {
  25: {
    left: GIVING_GRID_COL_LEFT,
    top: GIVING_GRID_ROW1_TOP,
    width: GIVING_GRID_COL_WIDTH,
    height: GIVING_GRID_ROW_HEIGHT,
    check: { left: "11.5%", top: "57.8%", size: "3.2%" },
  },
  50: {
    left: GIVING_GRID_COL_RIGHT,
    top: GIVING_GRID_ROW1_TOP,
    width: GIVING_GRID_COL_WIDTH,
    height: GIVING_GRID_ROW_HEIGHT,
    check: { left: "57.5%", top: "57.8%", size: "3.2%" },
  },
  100: {
    left: GIVING_GRID_COL_LEFT,
    top: GIVING_GRID_ROW2_TOP,
    width: GIVING_GRID_COL_WIDTH,
    height: GIVING_GRID_ROW_HEIGHT,
    check: { left: "11.5%", top: "69.9%", size: "3.2%" },
  },
  250: {
    left: GIVING_GRID_COL_RIGHT,
    top: GIVING_GRID_ROW2_TOP,
    width: GIVING_GRID_COL_WIDTH,
    height: GIVING_GRID_ROW_HEIGHT,
    check: { left: "57.5%", top: "69.9%", size: "3.2%" },
  },
};

/** 2×2 preset amount grid — measured from mobile-main-background.png. */
export const GIVING_MOBILE_AMOUNT_SLOTS: readonly GivingMobileAmountCard[] =
  givingAmounts.map((card) => ({
    ...card,
    ...GIVING_MOBILE_AMOUNT_SLOT_LAYOUT[card.amount],
  }));

/** “$ OTHER AMOUNT” field between the grid and Give Now. */
export const GIVING_MOBILE_CUSTOM_AMOUNT_SLOT: GivingOverlayRect = {
  left: "7.6%",
  top: "79.2%",
  width: "84.4%",
  height: "5.8%",
};

export const GIVING_MOBILE_GIVE_NOW_SLOT: GivingOverlayRect = {
  left: "7.6%",
  top: "84.8%",
  width: "84.4%",
  height: "6.8%",
};

export const GIVING_MOBILE_ERROR_SLOT: GivingOverlayRect = {
  left: "7.6%",
  top: "82.6%",
  width: "84.4%",
  height: "2.2%",
};

/** Legacy frequency toggles — not on current mobile art; checkout defaults to one-time. */
export const GIVING_MOBILE_FREQUENCY_SLOTS: ReadonlyArray<
  GivingOverlayRect & { frequency: GivingFrequency; label: string }
> = [] as const;
