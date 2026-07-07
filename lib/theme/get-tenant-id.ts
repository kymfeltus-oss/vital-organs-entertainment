import { headers } from "next/headers";
import { getActiveWorkspaceId } from "@/lib/theme/enterprise/workspace-overrides";

export const TENANT_ID_HEADER = "x-tenant-id";
export const TENANT_ID_COOKIE = "x-tenant-id";

/** Server-only: tenant ID injected by subdomain proxy. */
export async function getRequestTenantId(): Promise<string | null> {
  const headerStore = await headers();
  const fromHeader = headerStore.get(TENANT_ID_HEADER)?.trim();
  if (fromHeader) return fromHeader.toLowerCase();

  return null;
}

/** Client-safe tenant ID from cookie or workspace env fallback. */
export function getClientTenantId(): string | null {
  if (typeof document === "undefined") return null;

  const cookieMatch = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${TENANT_ID_COOKIE}=([^;]+)`),
  );
  if (cookieMatch?.[1]) {
    return decodeURIComponent(cookieMatch[1]).trim().toLowerCase();
  }

  const workspaceId = getActiveWorkspaceId();
  return workspaceId !== "default" ? workspaceId : null;
}
