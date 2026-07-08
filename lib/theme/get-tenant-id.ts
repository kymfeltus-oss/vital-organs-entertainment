import { headers } from "next/headers";
import { TENANT_ID_HEADER } from "@/lib/theme/tenant-id-constants";

export { TENANT_ID_COOKIE, TENANT_ID_HEADER } from "@/lib/theme/tenant-id-constants";
export { getClientTenantId } from "@/lib/theme/get-client-tenant-id";

/** Server-only: tenant ID injected by subdomain proxy. */
export async function getRequestTenantId(): Promise<string | null> {
  const headerStore = await headers();
  const fromHeader = headerStore.get(TENANT_ID_HEADER)?.trim();
  if (fromHeader) return fromHeader.toLowerCase();

  return null;
}
