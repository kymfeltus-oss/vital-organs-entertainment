import { normalizeTenantId } from "@/lib/onboarding/tenant-id";
import { getActiveWorkspaceId } from "@/lib/theme/enterprise/workspace-overrides";
import { extractTenantSubdomain } from "@/lib/theme/platform-domains";
import { TENANT_ID_COOKIE } from "@/lib/theme/tenant-id-constants";

export const DEV_TENANT_STORAGE_KEY = "parable-admin-tenant-slug";

function readEnvAdminTenantSlug(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_ADMIN_TENANT_SLUG?.trim();
  return fromEnv ? normalizeTenantId(fromEnv) : null;
}

function readCookieTenantId(cookieHeader?: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${TENANT_ID_COOKIE}=([^;]+)`),
  );
  if (!match?.[1]) return null;
  return normalizeTenantId(decodeURIComponent(match[1]));
}

export function readTenantIdFromSearch(
  search?: string | URLSearchParams | null,
): string | null {
  if (!search) return null;

  const params =
    typeof search === "string"
      ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      : search;

  const fromQuery =
    params.get("tenantId")?.trim() || params.get("tenant")?.trim() || null;
  return fromQuery ? normalizeTenantId(fromQuery) : null;
}

export function readTenantIdFromHostname(hostname: string): string | null {
  const subdomain = extractTenantSubdomain(hostname);
  return subdomain ? normalizeTenantId(subdomain) : null;
}

export function readStoredDevTenantSlug(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  const stored = sessionStorage.getItem(DEV_TENANT_STORAGE_KEY)?.trim();
  return stored ? normalizeTenantId(stored) : null;
}

export function persistDevTenantSlug(slug: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(DEV_TENANT_STORAGE_KEY, normalizeTenantId(slug));
}

/** Client/browser tenant resolution — subdomain, query param, cookie, session, env. */
export function resolveClientTenantId(options?: {
  search?: string | URLSearchParams | null;
  hostname?: string | null;
}): string | null {
  const fromQuery = readTenantIdFromSearch(options?.search ?? null);
  if (fromQuery) return fromQuery;

  if (typeof window !== "undefined") {
    const fromHost = readTenantIdFromHostname(options?.hostname ?? window.location.host);
    if (fromHost) return fromHost;

    const fromCookie = readCookieTenantId(document.cookie);
    if (fromCookie) return fromCookie;

    const fromSession = readStoredDevTenantSlug();
    if (fromSession) return fromSession;
  }

  const workspaceId = getActiveWorkspaceId();
  if (workspaceId !== "default") {
    return normalizeTenantId(workspaceId);
  }

  return readEnvAdminTenantSlug();
}

type ServerTenantContextInput = {
  explicit?: string | null;
  host?: string | null;
  tenantHeader?: string | null;
  cookieHeader?: string | null;
};

/** Server/API tenant resolution — explicit id, proxy header, host subdomain, cookie, env. */
export function resolveServerTenantId(input: ServerTenantContextInput = {}): string | null {
  if (input.explicit?.trim()) {
    return normalizeTenantId(input.explicit);
  }

  if (input.tenantHeader?.trim()) {
    return normalizeTenantId(input.tenantHeader);
  }

  if (input.host) {
    const fromHost = readTenantIdFromHostname(input.host);
    if (fromHost) return fromHost;
  }

  const fromCookie = readCookieTenantId(input.cookieHeader ?? null);
  if (fromCookie) return fromCookie;

  return readEnvAdminTenantSlug();
}
