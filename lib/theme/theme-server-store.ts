import type { TenantThemePatch } from "@/lib/theme/merge-theme";
import { DEFAULT_TENANT_THEME } from "@/lib/theme/default-theme";
import { mergeTenantTheme } from "@/lib/theme/merge-theme";
import { parseTenantThemePayload } from "@/lib/theme/parse-theme-payload";
import type { TenantTheme } from "@/lib/theme/types";

/**
 * In-memory tenant theme store — placeholder until database persistence lands.
 * Survives for the lifetime of the server process only.
 */
let serverThemePatch: TenantThemePatch | null = null;

export function getServerTenantTheme(): TenantTheme {
  return mergeTenantTheme(DEFAULT_TENANT_THEME, serverThemePatch);
}

export function setServerTenantThemePayload(payload: unknown): TenantTheme | null {
  const patch = parseTenantThemePayload(payload);
  if (!patch) return null;
  serverThemePatch = patch;
  return getServerTenantTheme();
}

export function clearServerTenantTheme(): void {
  serverThemePatch = null;
}
