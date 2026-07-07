/** Self-service admin tier identifiers — extend when billing wires in. */
export type AdminTierId = "starter" | "pro" | "enterprise";

/**
 * Capability keys gate admin modules. Enterprise tenants may append overrides
 * that unlock or lock individual capabilities without changing their base tier.
 */
export type AdminCapability =
  | "branding.identity"
  | "branding.colors"
  | "branding.assets"
  | "contact.socials"
  | "features.visibility"
  | "live.preview"
  | "analytics.overview"
  | "enterprise.custom-theme"
  | "enterprise.api-overrides"
  | "enterprise.dedicated-support";

export type EnterpriseCapabilityOverrides = Partial<Record<AdminCapability, boolean>>;

export type TenantAdminContext = {
  tier: AdminTierId;
  /** Per-tenant enterprise grants/revocations layered on top of base tier. */
  enterpriseOverrides?: EnterpriseCapabilityOverrides;
};

export type AdminModuleStatus = "available" | "locked" | "coming-soon";

export type AdminModule = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  requiredCapability: AdminCapability;
  status: AdminModuleStatus;
  tierLabel: string;
};
