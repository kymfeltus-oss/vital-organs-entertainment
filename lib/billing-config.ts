/** Stripe Checkout seed bundles — server source of truth for pricing + fulfillment mapping. */

export type SeedBillingPackageId =
  | "seeds_100"
  | "seeds_300"
  | "seeds_600"
  | "seeds_1200";

export type SeedBillingPackage = {
  /** Client-facing package id sent to `/api/billing/checkout`. */
  id: SeedBillingPackageId;
  count: number;
  /** USD retail price (display + pending-order staging). */
  price: number;
  /** `orders.product_type` + webhook fulfillment key. */
  productType: string;
  /** Env var holding the Stripe Price ID (`price_…`). */
  stripePriceEnv: string;
};

export const SEED_PACKAGES: readonly SeedBillingPackage[] = [
  {
    id: "seeds_100",
    count: 100,
    price: 1.99,
    productType: "seed-pack-100",
    stripePriceEnv: "STRIPE_PRICE_SEEDS_100",
  },
  {
    id: "seeds_300",
    count: 300,
    price: 4.99,
    productType: "seed-pack-300",
    stripePriceEnv: "STRIPE_PRICE_SEEDS_300",
  },
  {
    id: "seeds_600",
    count: 600,
    price: 8.99,
    productType: "seed-pack-600",
    stripePriceEnv: "STRIPE_PRICE_SEEDS_600",
  },
  {
    id: "seeds_1200",
    count: 1200,
    price: 15.99,
    productType: "seed-pack-1200",
    stripePriceEnv: "STRIPE_PRICE_SEEDS_1200",
  },
] as const;

export const SEED_BILLING_DEFAULT_PACKAGE_ID: SeedBillingPackageId = "seeds_100";

export function getSeedBillingPackage(
  packageId: string,
): SeedBillingPackage | undefined {
  return SEED_PACKAGES.find((entry) => entry.id === packageId);
}

/** Resolve configured Stripe Price ID for a package (server-only). */
export function resolveSeedStripePriceId(pkg: SeedBillingPackage): string | null {
  const value = process.env[pkg.stripePriceEnv]?.trim();
  return value && value.startsWith("price_") ? value : null;
}

export function seedBillingPriceCents(pkg: SeedBillingPackage): number {
  return Math.round(pkg.price * 100);
}

export function formatSeedBillingPrice(price: number): string {
  return price.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
