import { DEFAULT_TENANT_THEME } from "@/lib/theme/default-theme";
import { getTenantTheme as getTenantThemeFromStore } from "@/lib/theme/get-tenant-theme";
import type { TenantTheme } from "@/lib/theme/types";

/** Baseline theme alias for tenant resolver consumers. */
export const defaultTheme = DEFAULT_TENANT_THEME;

/**
 * Server-safe tenant branding resolver.
 * Queries `public.tenant_themes` and falls back to `defaultTheme` on any failure.
 */
export async function getTenantTheme(tenantId: string): Promise<TenantTheme> {
  if (!tenantId || tenantId === "default") {
    return defaultTheme;
  }

  return getTenantThemeFromStore(tenantId);
}

export type { TenantTheme };
