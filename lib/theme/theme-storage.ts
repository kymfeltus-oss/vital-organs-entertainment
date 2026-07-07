import { DEFAULT_TENANT_THEME } from "@/lib/theme/default-theme";
import { mergeTenantTheme } from "@/lib/theme/merge-theme";
import { parseTenantThemePayload } from "@/lib/theme/parse-theme-payload";
import type { TenantTheme } from "@/lib/theme/types";

export const TENANT_THEME_STORAGE_KEY = "event-platform-tenant-theme";

export function loadStoredTenantTheme(): TenantTheme | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(TENANT_THEME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = parseTenantThemePayload(JSON.parse(raw));
    if (!parsed) return null;
    return mergeTenantTheme(DEFAULT_TENANT_THEME, parsed);
  } catch {
    return null;
  }
}

export function saveStoredTenantTheme(theme: TenantTheme): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TENANT_THEME_STORAGE_KEY, JSON.stringify(theme));
}

export function clearStoredTenantTheme(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TENANT_THEME_STORAGE_KEY);
}
