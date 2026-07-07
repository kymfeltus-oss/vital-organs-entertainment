/** Tenant subdomain validation — isolated from viewer/stream auth. */

export const RESERVED_TENANT_IDS = new Set([
  "www",
  "default",
  "admin",
  "api",
  "app",
  "assets",
  "auth",
  "cdn",
  "dashboard",
  "docs",
  "help",
  "login",
  "mail",
  "media",
  "onboarding",
  "owner",
  "static",
  "status",
  "stream",
  "support",
  "www",
]);

const TENANT_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/;

export function normalizeTenantId(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidTenantId(value: string): boolean {
  const normalized = normalizeTenantId(value);
  if (!normalized || normalized.length < 3 || normalized.length > 32) return false;
  if (RESERVED_TENANT_IDS.has(normalized)) return false;
  return TENANT_ID_PATTERN.test(normalized);
}

export function sanitizeTenantIdInput(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 32);
}
