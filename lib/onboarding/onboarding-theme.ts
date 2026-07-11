import { DEFAULT_TENANT_THEME } from "@/lib/theme/default-theme";
import { mergeTenantTheme } from "@/lib/theme/merge-theme";
import type { TenantTheme } from "@/lib/theme/types";

export const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  if (!HEX_COLOR_PATTERN.test(trimmed)) return null;
  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return trimmed.toLowerCase();
}

export type OnboardingThemeInput = {
  companyName: string;
  ownerEmail: string;
  primaryColor: string;
  logoUrl?: string | null;
};

/** Map onboarding Step 3 values into the canonical TenantTheme contract. */
export function buildOnboardingTenantTheme(input: OnboardingThemeInput): TenantTheme {
  const companyName = input.companyName.trim();
  const ownerEmail = input.ownerEmail.trim().toLowerCase();
  const primaryColor = normalizeHexColor(input.primaryColor) ?? DEFAULT_TENANT_THEME.colors.primary;

  return mergeTenantTheme(DEFAULT_TENANT_THEME, {
    appName: companyName,
    logoUrl: input.logoUrl ?? null,
    contact: {
      email: ownerEmail,
      mailSubjectPrefix: `Contact from ${companyName}`,
    },
    colors: {
      primary: primaryColor,
      accent: primaryColor,
    },
  });
}

export function tenantThemeToDatabaseRow(args: {
  tenantId: string;
  ownerEmail: string;
  ownerUserId: string;
  theme: TenantTheme;
  tier?: string;
  logoUrl?: string | null;
}): Record<string, unknown> {
  const ownerEmail = args.ownerEmail.trim().toLowerCase();
  const tier = args.tier?.trim() || "starter";

  return {
    tenant_id: args.tenantId,
    company_name: args.theme.appName,
    app_name: args.theme.appName,
    owner_email: ownerEmail,
    owner_user_id: args.ownerUserId,
    tagline: args.theme.tagline,
    tier,
    logo_url: args.logoUrl ?? args.theme.logoUrl,
    primary_color: args.theme.colors.primary,
    colors: args.theme.colors,
    contact: args.theme.contact,
    features: args.theme.features,
    fonts: args.theme.fonts,
    layout: args.theme.layout,
    social_links: args.theme.socialLinks,
    updated_at: new Date().toISOString(),
  };
}

export function tenantUrlForId(tenantId: string, platformHost: string): string {
  if (platformHost === "localhost:3000" || platformHost.startsWith("localhost:")) {
    return `http://${tenantId}.${platformHost}`;
  }
  return `https://${tenantId}.${platformHost}`;
}
