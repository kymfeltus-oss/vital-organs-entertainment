import type {
  AdminCapability,
  AdminTierId,
  EnterpriseCapabilityOverrides,
  TenantAdminContext,
} from "@/lib/admin/types";

export const ADMIN_TIER_ORDER: readonly AdminTierId[] = [
  "starter",
  "pro",
  "enterprise",
] as const;

export const ADMIN_TIER_LABELS: Record<AdminTierId, string> = {
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

/** Base capabilities included with each self-service tier. */
export const TIER_CAPABILITIES: Record<AdminTierId, readonly AdminCapability[]> = {
  starter: [
    "branding.identity",
    "branding.colors",
    "contact.socials",
  ],
  pro: [
    "branding.identity",
    "branding.colors",
    "branding.assets",
    "contact.socials",
    "features.visibility",
    "live.preview",
    "analytics.overview",
  ],
  enterprise: [
    "branding.identity",
    "branding.colors",
    "branding.assets",
    "contact.socials",
    "features.visibility",
    "live.preview",
    "analytics.overview",
    "enterprise.custom-theme",
    "enterprise.api-overrides",
    "enterprise.dedicated-support",
  ],
};

export function tierIncludesCapability(
  tier: AdminTierId,
  capability: AdminCapability,
): boolean {
  return TIER_CAPABILITIES[tier].includes(capability);
}

/**
 * Resolve whether a capability is enabled for this tenant.
 * Enterprise overrides win over the base tier map when explicitly set.
 */
export function hasAdminCapability(
  context: TenantAdminContext,
  capability: AdminCapability,
): boolean {
  const override = context.enterpriseOverrides?.[capability];
  if (override !== undefined) return override;
  return tierIncludesCapability(context.tier, capability);
}

export function minimumTierForCapability(capability: AdminCapability): AdminTierId {
  for (const tier of ADMIN_TIER_ORDER) {
    if (tierIncludesCapability(tier, capability)) return tier;
  }
  return "enterprise";
}

export function applyEnterpriseOverrides(
  context: TenantAdminContext,
  overrides: EnterpriseCapabilityOverrides,
): TenantAdminContext {
  return {
    ...context,
    enterpriseOverrides: {
      ...context.enterpriseOverrides,
      ...overrides,
    },
  };
}

/** Runtime streaming / platform limits enforced by billing tier. */
export type SubscriptionTier = "starter" | "pro" | "enterprise";

export interface TierFeatures {
  streamQualityCap: "720p" | "1080p" | "4k";
  allowVideoOnDemand: boolean;
  allowVirtualGifting: boolean;
  allowLiveInteractions: boolean;
  maxConcurrentStreams: number;
}

export const TIER_CONFIGS: Record<SubscriptionTier, TierFeatures> = {
  starter: {
    streamQualityCap: "720p",
    allowVideoOnDemand: true,
    allowVirtualGifting: false,
    allowLiveInteractions: false,
    maxConcurrentStreams: 1,
  },
  pro: {
    streamQualityCap: "1080p",
    allowVideoOnDemand: true,
    allowVirtualGifting: true,
    allowLiveInteractions: true,
    maxConcurrentStreams: 3,
  },
  enterprise: {
    streamQualityCap: "4k",
    allowVideoOnDemand: true,
    allowVirtualGifting: true,
    allowLiveInteractions: true,
    maxConcurrentStreams: 999,
  },
};

export function verifyFeatureAccess(
  currentTier: string | null | undefined,
  feature: keyof TierFeatures,
): TierFeatures[keyof TierFeatures] {
  const normalizedTier = (currentTier?.toLowerCase() || "starter") as SubscriptionTier;
  const config = TIER_CONFIGS[normalizedTier] || TIER_CONFIGS.starter;
  return config[feature];
}
