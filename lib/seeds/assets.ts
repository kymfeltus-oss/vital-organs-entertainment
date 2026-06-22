import { MOBILE_ARTBOARD_REF } from "@/lib/responsive";
import { SEED_ECONOMY_PACKS } from "@/lib/merch/catalog";

/** Buy Seeds page — flat background + native overlay content. */

export const BUY_SEEDS_ASSET_VERSION = "20260622-4";

export const BUY_SEEDS_ASSETS = {
  mobileBackground: `/buy-seeds/mobile-main-background.png?v=${BUY_SEEDS_ASSET_VERSION}`,
} as const;

export const BUY_SEEDS_MOBILE_ART = MOBILE_ARTBOARD_REF;

/** Native PNG plate — same 1080×1920 stage as attendee dashboard. */
export const BUY_SEEDS_MOBILE_ART_NATIVE = MOBILE_ARTBOARD_REF;

/**
 * Measured active art bounds on mobile-main-background.png (1080×1920).
 * Hero + UI art spans cols 96–983 (~82% canvas); scale X to fill dashboard track.
 */
export const BUY_SEEDS_ARTBOARD_CONTENT_BOUNDS = {
  left: 96,
  right: 983,
  width: 887,
  canvasWidth: 1080,
} as const;

/** Horizontal scale — removes PNG side letterbox on the full plate. */
export const BUY_SEEDS_ARTBOARD_WIDTH_SCALE =
  BUY_SEEDS_ARTBOARD_CONTENT_BOUNDS.canvasWidth /
  BUY_SEEDS_ARTBOARD_CONTENT_BOUNDS.width;

/** @deprecated Use BUY_SEEDS_ARTBOARD_WIDTH_SCALE */
export const BUY_SEEDS_HERO_WIDTH_SCALE = BUY_SEEDS_ARTBOARD_WIDTH_SCALE;

/** @deprecated Use BUY_SEEDS_MOBILE_ART */
export const BUY_SEEDS_ART = BUY_SEEDS_MOBILE_ART;

export type SeedPackageOverlay = {
  packageId: string;
  productId: string;
  seeds: number;
  badge: string;
  price: string;
};

/** Black mask — hides baked row borders/glow (starts above first neon edge). */
export const BUY_SEEDS_BAKED_CONTROLS_MASK = {
  left: "0%",
  top: "53%",
  width: "100%",
  height: "38%",
} as const;

/** Native package list panel — aligned to four baked row slots on the PNG. */
export const BUY_SEEDS_PACKAGES_PANEL = {
  left: "calc(40 / 1080 * 100%)",
  top: "54.45%",
  width: "calc(100% - 2 * 40 / 1080 * 100%)",
  height: "21.5%",
} as const;

/** Native package rows — text rendered in React over masked PNG slots. */
export const seedPackages = [
  {
    packageId: "seed-pack-100",
    productId: SEED_ECONOMY_PACKS[0].productId,
    seeds: 100,
    badge: "POPULAR",
    price: "$1.99",
  },
  {
    packageId: "seed-pack-300",
    productId: SEED_ECONOMY_PACKS[1].productId,
    seeds: 300,
    badge: "SAVE 10%",
    price: "$4.99",
  },
  {
    packageId: "seed-pack-600",
    productId: SEED_ECONOMY_PACKS[2].productId,
    seeds: 600,
    badge: "SAVE 20%",
    price: "$8.99",
  },
  {
    packageId: "seed-pack-1200",
    productId: SEED_ECONOMY_PACKS[2].productId,
    seeds: 1200,
    badge: "BEST VALUE",
    price: "$15.99",
  },
] as const satisfies ReadonlyArray<SeedPackageOverlay>;

export type SeedPackageId = (typeof seedPackages)[number]["packageId"];

export const BUY_SEEDS_DEFAULT_PACKAGE_ID: SeedPackageId = "seed-pack-100";

export const BUY_SEEDS_CONTINUE_SLOT = {
  label: "Continue to payment",
  left: "calc(40 / 1080 * 100%)",
  top: "81.2%",
  width: "calc(100% - 2 * 40 / 1080 * 100%)",
  height: "6.2%",
} as const;

export const BUY_SEEDS_ERROR_SLOT = {
  left: "calc(40 / 1080 * 100%)",
  top: "79.4%",
  width: "calc(100% - 2 * 40 / 1080 * 100%)",
  height: "1.6%",
} as const;

export function getSeedPackage(packageId: string): SeedPackageOverlay | undefined {
  return seedPackages.find((entry) => entry.packageId === packageId);
}
