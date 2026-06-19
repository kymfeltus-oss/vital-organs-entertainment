import { SEED_ECONOMY_PACKS } from "@/lib/merch/catalog";

export type BuySeedsOverlayRect = {
  left: string;
  top: string;
  width: string;
  height: string;
};

export type BuySeedsRadioSlot = {
  left: string;
  top: string;
  size: string;
};

export type BuySeedsPackage = BuySeedsOverlayRect & {
  packageId: string;
  productId: string;
  label: string;
  radio: BuySeedsRadioSlot;
};

/** Percentage hit targets on seeds-coins-background.png (1080×1920). */
export const BUY_SEEDS_CONTINUE_SLOT: BuySeedsOverlayRect & { label: string } = {
  label: "Continue to payment",
  left: "13.5%",
  top: "72.0%",
  width: "72.9%",
  height: "6.5%",
};

export const BUY_SEEDS_ERROR_SLOT: BuySeedsOverlayRect = {
  left: "13.5%",
  top: "70.2%",
  width: "72.9%",
  height: "1.6%",
};

export const BUY_SEEDS_DEFAULT_PACKAGE_ID = "seed-pack-100" as const;

/**
 * Four package rows — full-width tappable bands aligned to PNG row art.
 * Coordinates are percentages of the 1080×1920 stage (not offset to track edge).
 */
export const BUY_SEEDS_PACKAGES: readonly BuySeedsPackage[] = [
  {
    packageId: "seed-pack-100",
    productId: SEED_ECONOMY_PACKS[0].productId,
    label: "100 Seeds — $1.99",
    left: "13.4%",
    top: "43.3%",
    width: "73.1%",
    height: "4.6%",
    radio: { left: "15.9%", top: "44.6%", size: "3.2%" },
  },
  {
    packageId: "seed-pack-300",
    productId: SEED_ECONOMY_PACKS[1].productId,
    label: "300 Seeds — $4.99",
    left: "13.4%",
    top: "48.3%",
    width: "73.1%",
    height: "4.4%",
    radio: { left: "15.9%", top: "49.2%", size: "3.2%" },
  },
  {
    packageId: "seed-pack-600",
    productId: SEED_ECONOMY_PACKS[2].productId,
    label: "600 Seeds — $8.99",
    left: "13.4%",
    top: "53.1%",
    width: "73.1%",
    height: "4.3%",
    radio: { left: "15.9%", top: "53.9%", size: "3.2%" },
  },
  {
    packageId: "seed-pack-1200",
    productId: SEED_ECONOMY_PACKS[2].productId,
    label: "1,200 Seeds — $15.99 (Best Value)",
    left: "13.4%",
    top: "57.8%",
    width: "73.1%",
    height: "4.2%",
    radio: { left: "15.9%", top: "58.4%", size: "3.2%" },
  },
] as const;

export function getBuySeedsPackage(packageId: string): BuySeedsPackage | undefined {
  return BUY_SEEDS_PACKAGES.find((entry) => entry.packageId === packageId);
}
