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

export const BUY_SEEDS_BALANCE_SLOT: BuySeedsOverlayRect = {
  left: "12%",
  top: "32.5%",
  width: "38%",
  height: "6.5%",
};

export const BUY_SEEDS_CONTINUE_SLOT: BuySeedsOverlayRect & { label: string } = {
  label: "Continue to payment",
  left: "7%",
  top: "64.5%",
  width: "86%",
  height: "6.5%",
};

/** Four package rows on the artboard — rows 3–4 map to the largest catalog pack. */
export const BUY_SEEDS_PACK_SLOTS: readonly BuySeedsPackSlot[] = [
  {
    productId: SEED_ECONOMY_PACKS[0].productId,
    label: `${SEED_ECONOMY_PACKS[0].seedAmount.toLocaleString("en-US")} Seeds — $${SEED_ECONOMY_PACKS[0].price}`,
    left: "7%",
    top: "41%",
    width: "86%",
    height: "5.5%",
  },
  {
    productId: SEED_ECONOMY_PACKS[1].productId,
    label: `${SEED_ECONOMY_PACKS[1].seedAmount.toLocaleString("en-US")} Seeds — $${SEED_ECONOMY_PACKS[1].price}`,
    left: "7%",
    top: "47%",
    width: "86%",
    height: "5.5%",
  },
  {
    productId: SEED_ECONOMY_PACKS[2].productId,
    label: `${SEED_ECONOMY_PACKS[2].seedAmount.toLocaleString("en-US")} Seeds — $${SEED_ECONOMY_PACKS[2].price}`,
    left: "7%",
    top: "53%",
    width: "86%",
    height: "5.5%",
  },
  {
    productId: SEED_ECONOMY_PACKS[2].productId,
    label: `${SEED_ECONOMY_PACKS[2].seedAmount.toLocaleString("en-US")} Seeds — $${SEED_ECONOMY_PACKS[2].price} (Best Value)`,
    left: "7%",
    top: "59%",
    width: "86%",
    height: "5.5%",
  },
] as const;
