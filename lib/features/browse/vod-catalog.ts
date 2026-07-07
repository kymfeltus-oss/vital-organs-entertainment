import type { SubscriptionTier } from "@/lib/admin/tiers";

export type VodCategoryId =
  | "all"
  | "live_replays"
  | "broadcast_archives"
  | "backstage"
  | "enterprise_exclusives";

export type VodCatalogItem = {
  id: string;
  title: string;
  subtitle: string;
  runtime: string;
  category: Exclude<VodCategoryId, "all">;
  requiredTier: SubscriptionTier;
  posterFrom: string;
  posterTo: string;
  isLive?: boolean;
};

export const VOD_CATEGORIES: readonly { id: VodCategoryId; label: string }[] = [
  { id: "all", label: "All Media" },
  { id: "live_replays", label: "Live Replays" },
  { id: "broadcast_archives", label: "Broadcast Archives" },
  { id: "backstage", label: "Backstage" },
  { id: "enterprise_exclusives", label: "Enterprise Exclusives" },
] as const;

export const VOD_CATALOG: readonly VodCatalogItem[] = [
  {
    id: "opening-keynote",
    title: "Global Launch Keynote",
    subtitle: "Flagship broadcast replay",
    runtime: "58m",
    category: "live_replays",
    requiredTier: "starter",
    posterFrom: "#0b1f33",
    posterTo: "#123f66",
  },
  {
    id: "studio-walkthrough",
    title: "Studio Control Walkthrough",
    subtitle: "Hardware telemetry overview",
    runtime: "24m",
    category: "broadcast_archives",
    requiredTier: "starter",
    posterFrom: "#101828",
    posterTo: "#1d3557",
  },
  {
    id: "multi-cam-masterclass",
    title: "Multi-Cam Routing Masterclass",
    subtitle: "vMix + X32 integration",
    runtime: "41m",
    category: "broadcast_archives",
    requiredTier: "pro",
    posterFrom: "#1a1033",
    posterTo: "#4b2eff",
  },
  {
    id: "token-economics-lab",
    title: "Token Economics Lab",
    subtitle: "Monetization architecture",
    runtime: "33m",
    category: "backstage",
    requiredTier: "pro",
    posterFrom: "#2a0f24",
    posterTo: "#ff0f8e",
    isLive: true,
  },
  {
    id: "4k-pipeline-deep-dive",
    title: "4K Pipeline Deep Dive",
    subtitle: "Extreme bitrate distribution",
    runtime: "47m",
    category: "enterprise_exclusives",
    requiredTier: "enterprise",
    posterFrom: "#120818",
    posterTo: "#6c4dff",
  },
  {
    id: "native-app-packaging",
    title: "Native App Packaging Blueprint",
    subtitle: "App Store + Google Play delivery",
    runtime: "36m",
    category: "enterprise_exclusives",
    requiredTier: "enterprise",
    posterFrom: "#0d111d",
    posterTo: "#00c2ff",
  },
] as const;

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

export function requiredTierLabel(tier: SubscriptionTier): string {
  if (tier === "enterprise") return "Enterprise Stack";
  if (tier === "pro") return "Network Pro";
  return "Starter Node";
}
