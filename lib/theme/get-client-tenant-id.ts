import { resolveClientTenantId } from "@/lib/theme/resolve-tenant-context";

/** Client-safe tenant ID from subdomain, query param, cookie, session, or env fallback. */
export function getClientTenantId(): string | null {
  if (typeof window === "undefined") return null;
  return resolveClientTenantId({
    search: window.location.search,
    hostname: window.location.host,
  });
}
