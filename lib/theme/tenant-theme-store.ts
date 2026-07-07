import { DEFAULT_TENANT_THEME } from "@/lib/theme/default-theme";
import { mergeTenantTheme, type TenantThemePatch } from "@/lib/theme/merge-theme";
import { parseTenantThemePayload } from "@/lib/theme/parse-theme-payload";
import { getServerTenantTheme } from "@/lib/theme/theme-server-store";
import type { TenantTheme } from "@/lib/theme/types";

/** Per-tenant in-memory theme patches until database persistence lands. */
const tenantThemePatches = new Map<string, TenantThemePatch>();

export function getTenantThemeById(tenantId: string): TenantTheme {
  const normalized = tenantId.trim().toLowerCase();
  if (!normalized) return getServerTenantTheme();

  const patch = tenantThemePatches.get(normalized);
  if (patch) {
    return mergeTenantTheme(DEFAULT_TENANT_THEME, patch);
  }

  return getServerTenantTheme();
}

export function setTenantThemePayload(
  tenantId: string,
  payload: unknown,
): TenantTheme | null {
  const normalized = tenantId.trim().toLowerCase();
  if (!normalized) return null;

  const patch = parseTenantThemePayload(payload);
  if (!patch) return null;

  tenantThemePatches.set(normalized, patch);
  return getTenantThemeById(normalized);
}

export function clearTenantTheme(tenantId: string): void {
  const normalized = tenantId.trim().toLowerCase();
  if (!normalized) return;
  tenantThemePatches.delete(normalized);
}
