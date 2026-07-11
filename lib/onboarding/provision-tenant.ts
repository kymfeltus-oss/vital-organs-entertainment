import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  buildOnboardingTenantTheme,
  tenantThemeToDatabaseRow,
  tenantUrlForId,
  type OnboardingThemeInput,
} from "@/lib/onboarding/onboarding-theme";
import { clearGlobalThemeMemory, clearTenantRuntimeCache } from "@/lib/onboarding/clear-tenant-cache";
import { isTenantIdAvailable } from "@/lib/onboarding/tenant-themes-repository";
import { findTenantIdByOwnerEmail } from "@/lib/onboarding/owner-auth";
import { normalizeTenantId } from "@/lib/onboarding/tenant-id";
import { getMarketingPlatformHost } from "@/lib/theme/platform-domains";
import type { TenantTheme } from "@/lib/theme/types";

export type ProvisionTenantInput = OnboardingThemeInput & {
  tenantId: string;
  ownerUserId: string;
  tier?: string;
  logoUrl?: string | null;
};

export type ProvisionTenantResult =
  | {
      ok: true;
      tenantId: string;
      tenantUrl: string;
      theme: TenantTheme;
      alreadyProvisioned?: boolean;
    }
  | { ok: false; message: string; code?: "subdomain_taken" | "db_error" };

export async function provisionTenantInfrastructure(
  input: ProvisionTenantInput,
): Promise<ProvisionTenantResult> {
  const tenantId = normalizeTenantId(input.tenantId);
  if (!tenantId) {
    return { ok: false, message: "Invalid tenant identifier." };
  }

  const ownerEmail = input.ownerEmail.trim().toLowerCase();
  const existingTenantId = await findTenantIdByOwnerEmail(ownerEmail);
  const platformHost = getMarketingPlatformHost();

  if (existingTenantId) {
    const theme = buildOnboardingTenantTheme(input);
    const row = tenantThemeToDatabaseRow({
      tenantId: existingTenantId,
      ownerEmail,
      ownerUserId: input.ownerUserId,
      theme,
      tier: input.tier,
      logoUrl: input.logoUrl ?? null,
    });

    const { error } = await getSupabaseAdmin()
      .from("tenant_themes")
      .update(row)
      .eq("tenant_id", existingTenantId);

    if (error) {
      return { ok: false, code: "db_error", message: error.message || "Unable to update tenant settings." };
    }

    clearTenantRuntimeCache(existingTenantId);
    clearGlobalThemeMemory();

    return {
      ok: true,
      tenantId: existingTenantId,
      tenantUrl: tenantUrlForId(existingTenantId, platformHost),
      theme,
      alreadyProvisioned: true,
    };
  }

  const available = await isTenantIdAvailable(tenantId);
  if (!available) {
    return {
      ok: false,
      code: "subdomain_taken",
      message: "That subdomain is already registered.",
    };
  }

  const theme = buildOnboardingTenantTheme(input);
  const row = tenantThemeToDatabaseRow({
    tenantId,
    ownerEmail,
    ownerUserId: input.ownerUserId,
    theme,
    tier: input.tier,
    logoUrl: input.logoUrl ?? null,
  });

  const { error } = await getSupabaseAdmin().from("tenant_themes").insert(row);

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        code: "subdomain_taken",
        message: "That subdomain is already registered.",
      };
    }
    return { ok: false, code: "db_error", message: error.message || "Unable to save tenant settings." };
  }

  clearTenantRuntimeCache(tenantId);
  clearGlobalThemeMemory();

  return {
    ok: true,
    tenantId,
    tenantUrl: tenantUrlForId(tenantId, platformHost),
    theme,
  };
}
