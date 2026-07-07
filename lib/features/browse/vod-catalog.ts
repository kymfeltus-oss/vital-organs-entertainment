import type { SubscriptionTier } from "@/lib/admin/tiers";

export type BrowseCatalogItem = {
  id: string;
  title: string;
  duration: string;
  tierRequired: SubscriptionTier;
  /** Optional poster — CSS grid canvas renders when absent or broken. */
  thumbnail?: string;
  views: string;
  category: string;
};

const TIER_RANK: Record<SubscriptionTier, number> = {
  starter: 0,
  pro: 1,
  enterprise: 2,
};

export function normalizeSubscriptionTier(value: string | null | undefined): SubscriptionTier {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "pro" || normalized === "enterprise") return normalized;
  return "starter";
}

export function canAccessVodAsset(
  viewerTier: SubscriptionTier,
  requiredTier: SubscriptionTier,
): boolean {
  return TIER_RANK[viewerTier] >= TIER_RANK[requiredTier];
}

export function lockedTierLabel(tier: SubscriptionTier): string {
  if (tier === "enterprise") return "Enterprise Stack Required";
  if (tier === "pro") return "Network Pro Required";
  return "Starter Node Required";
}

export function requiredTierLabel(tier: SubscriptionTier): string {
  if (tier === "enterprise") return "Enterprise Stack";
  if (tier === "pro") return "Network Pro";
  return "Starter Node";
}

export function buildBrowseCategories(catalog: readonly BrowseCatalogItem[]): string[] {
  const categories = new Set(catalog.map((item) => item.category));
  return ["All Media", ...Array.from(categories)];
}
