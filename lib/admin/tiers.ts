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
