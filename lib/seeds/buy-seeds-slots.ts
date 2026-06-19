import { SEED_ECONOMY_PACKS } from "@/lib/merch/catalog";

export type BuySeedsPackSlot = {
  productId: string;
  label: string;
  left: string;
  top: string;
  width: string;
  height: string;
};

/** Percentage hit targets on the 853×1844 artboard — tune against final artwork. */
export const BUY_SEEDS_PACK_SLOTS: readonly BuySeedsPackSlot[] = [
  {
    productId: SEED_ECONOMY_PACKS[0].productId,
    label: `${SEED_ECONOMY_PACKS[0].title} — $${SEED_ECONOMY_PACKS[0].price}`,
    left: "8%",
    top: "56%",
    width: "84%",
    height: "9%",
  },
  {
    productId: SEED_ECONOMY_PACKS[1].productId,
    label: `${SEED_ECONOMY_PACKS[1].title} — $${SEED_ECONOMY_PACKS[1].price}`,
    left: "8%",
    top: "67%",
    width: "84%",
    height: "9%",
  },
  {
    productId: SEED_ECONOMY_PACKS[2].productId,
    label: `${SEED_ECONOMY_PACKS[2].title} — $${SEED_ECONOMY_PACKS[2].price}`,
    left: "8%",
    top: "78%",
    width: "84%",
    height: "9%",
  },
] as const;
