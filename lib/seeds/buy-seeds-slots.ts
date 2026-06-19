import { SEED_ECONOMY_PACKS } from "@/lib/merch/catalog";
import { MOBILE_ARTBOARD_BACK_HOTSPOT } from "@/lib/navigation/back-to-dashboard";

export type BuySeedsOverlayRect = {
  left: string;
  top: string;
  width: string;
  height: string;
};

export type BuySeedsPackSlot = BuySeedsOverlayRect & {
  productId: string;
  label: string;
};

/** Percentage hit targets on seeds-coins-background.png (853×1844). */
export const BUY_SEEDS_BACK_SLOT: BuySeedsOverlayRect & { label: string } = {
  label: MOBILE_ARTBOARD_BACK_HOTSPOT.label,
  left: MOBILE_ARTBOARD_BACK_HOTSPOT.left,
  top: MOBILE_ARTBOARD_BACK_HOTSPOT.top,
  width: MOBILE_ARTBOARD_BACK_HOTSPOT.width,
  height: MOBILE_ARTBOARD_BACK_HOTSPOT.height,
};

export const BUY_SEEDS_CONTINUE_SLOT: BuySeedsOverlayRect & { label: string } = {
  label: "Continue to payment",
  left: "5.5%",
  top: "66.8%",
  width: "89%",
  height: "7.2%",
};

export const BUY_SEEDS_ERROR_SLOT: BuySeedsOverlayRect = {
  left: "5.5%",
  top: "64.8%",
  width: "89%",
  height: "2%",
};

/**
 * Four package rows on the artboard — labels match PNG tiers; checkout uses catalog packs.
 * Rows 3–4 both map to the largest catalog pack until a fourth SKU exists.
 */
export const BUY_SEEDS_PACK_SLOTS: readonly BuySeedsPackSlot[] = [
  {
    productId: SEED_ECONOMY_PACKS[0].productId,
    label: "100 Seeds — $1.99",
    left: "5.5%",
    top: "42.8%",
    width: "89%",
    height: "5.4%",
  },
  {
    productId: SEED_ECONOMY_PACKS[1].productId,
    label: "300 Seeds — $4.99",
    left: "5.5%",
    top: "48.6%",
    width: "89%",
    height: "5.4%",
  },
  {
    productId: SEED_ECONOMY_PACKS[2].productId,
    label: "600 Seeds — $8.99",
    left: "5.5%",
    top: "54.4%",
    width: "89%",
    height: "5.4%",
  },
  {
    productId: SEED_ECONOMY_PACKS[2].productId,
    label: "1,200 Seeds — $15.99 (Best Value)",
    left: "5.5%",
    top: "60.2%",
    width: "89%",
    height: "5.4%",
  },
] as const;
