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
  maxResolution: "720p" | "1080p" | "4k";
  customDomainAllowed: boolean;
  customMobileAppsAllowed: boolean;
  maxChatRooms: number;
}

export const TIER_CONFIGS: Record<SubscriptionTier, TierFeatures> = {
  starter: {
    maxResolution: "720p",
    customDomainAllowed: false,
    customMobileAppsAllowed: false,
    maxChatRooms: 1,
  },
  pro: {
    maxResolution: "1080p",
    customDomainAllowed: true,
    customMobileAppsAllowed: false,
    maxChatRooms: 5,
  },
  enterprise: {
    maxResolution: "4k",
    customDomainAllowed: true,
    customMobileAppsAllowed: true,
    maxChatRooms: 999,
  },
};

function normalizeSubscriptionTier(value: string | null | undefined): SubscriptionTier {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "pro" || normalized === "enterprise") return normalized;
  return "starter";
}

/**
 * Safe feature-flag evaluator to guard premium interfaces without breaking execution loops.
 */
export function verifyFeatureAccess<F extends keyof TierFeatures>(
  currentTier: string | null | undefined,
  feature: F,
): TierFeatures[F] {
  const config = TIER_CONFIGS[normalizeSubscriptionTier(currentTier)];
  return config[feature];
}
