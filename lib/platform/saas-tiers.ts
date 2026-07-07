import type { AdminTierId } from "@/lib/admin/types";

export type PlatformSaasTier = {
  id: AdminTierId;
  name: string;
  priceLabel: string;
  priceSubtext: string;
  description: string;
  highlights: readonly string[];
  featured?: boolean;
  ctaLabel: string;
  contactSales?: boolean;
};

export const PLATFORM_SAAS_TIERS: readonly PlatformSaasTier[] = [
  {
    id: "starter",
    name: "Starter",
    priceLabel: "$99",
    priceSubtext: "per month",
    description: "Launch your first white-label stream with core branding controls.",
    highlights: [
      "Custom app name & tagline",
      "Palette token editor",
      "Contact & social links",
      "Attendee intro + email gate",
      "Live stream viewer experience",
    ],
    ctaLabel: "Buy Now",
  },
  {
    id: "pro",
    name: "Pro",
    priceLabel: "$249",
    priceSubtext: "per month",
    description: "Full self-service branding, feature gates, and production previews.",
    highlights: [
      "Everything in Starter",
      "Logo & favicon asset slots",
      "Feature visibility toggles",
      "Live preview sandbox",
      "Analytics overview dashboard",
    ],
    featured: true,
    ctaLabel: "Buy Now",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "Custom",
    priceSubtext: "annual contracts",
    description: "Hardcoded theme overrides, API hooks, and dedicated launch support.",
    highlights: [
      "Everything in Pro",
      "Enterprise code-level overrides",
      "Dedicated onboarding",
      "Custom subdomain provisioning",
      "Priority support SLA",
    ],
    ctaLabel: "Contact Sales",
    contactSales: true,
  },
] as const;

export function resolvePlatformStripePriceId(tierId: AdminTierId): string | null {
  const envKey =
    tierId === "starter"
      ? process.env.STRIPE_PRICE_PLATFORM_STARTER
      : tierId === "pro"
        ? process.env.STRIPE_PRICE_PLATFORM_PRO
        : process.env.STRIPE_PRICE_PLATFORM_ENTERPRISE;

  const priceId = envKey?.trim();
  if (!priceId || priceId.includes("price_...")) return null;
  return priceId;
}
