import { MOBILE_ARTBOARD_REF } from "@/lib/responsive";
import { SEED_ECONOMY_PACKS } from "@/lib/merch/catalog";

/** Buy Seeds page — flat background + native overlay content. */

export const BUY_SEEDS_ASSETS = {
  mobileBackground: "/buy-seeds/mobile-main-background.png",
} as const;

export const BUY_SEEDS_MOBILE_ART = MOBILE_ARTBOARD_REF;

/** @deprecated Use BUY_SEEDS_MOBILE_ART */
export const BUY_SEEDS_ART = BUY_SEEDS_MOBILE_ART;

export type SeedPackageOverlay = {
  packageId: string;
  productId: string;
  seeds: number;
  badge: string;
  price: string;
  left: string;
  top: string;
  width: string;
  height: string;
};

/** Native package rows — text rendered in React over empty PNG slots. */
export const seedPackages = [
  {
    packageId: "seed-pack-100",
    productId: SEED_ECONOMY_PACKS[0].productId,
    seeds: 100,
    badge: "POPULAR",
    price: "$1.99",
    left: "13%",
    top: "56.2%",
    width: "74%",
    height: "5.3%",
  },
  {
    packageId: "seed-pack-300",
    productId: SEED_ECONOMY_PACKS[1].productId,
    seeds: 300,
    badge: "SAVE 10%",
    price: "$4.99",
    left: "13%",
    top: "62.2%",
    width: "74%",
    height: "5.3%",
  },
  {
    packageId: "seed-pack-600",
    productId: SEED_ECONOMY_PACKS[2].productId,
    seeds: 600,
    badge: "SAVE 20%",
    price: "$8.99",
    left: "13%",
    top: "68.1%",
    width: "74%",
    height: "5.3%",
  },
  {
    packageId: "seed-pack-1200",
    productId: SEED_ECONOMY_PACKS[2].productId,
    seeds: 1200,
    badge: "BEST VALUE",
    price: "$15.99",
    left: "13%",
    top: "74.1%",
    width: "74%",
    height: "5.3%",
  },
] as const satisfies ReadonlyArray<SeedPackageOverlay>;

export type SeedPackageId = (typeof seedPackages)[number]["packageId"];

export const BUY_SEEDS_DEFAULT_PACKAGE_ID: SeedPackageId = "seed-pack-100";

export const BUY_SEEDS_CONTINUE_SLOT = {
  label: "Continue to payment",
  left: "13%",
  top: "81.2%",
  width: "74%",
  height: "6.2%",
} as const;

export const BUY_SEEDS_ERROR_SLOT = {
  left: "13%",
  top: "79.4%",
  width: "74%",
  height: "1.6%",
} as const;

export function getSeedPackage(packageId: string): SeedPackageOverlay | undefined {
  return seedPackages.find((entry) => entry.packageId === packageId);
}
