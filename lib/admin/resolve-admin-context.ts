import type { AdminTierId, TenantAdminContext } from "@/lib/admin/types";

const VALID_TIERS: readonly AdminTierId[] = ["starter", "pro", "enterprise"];

function parseTier(value: string | undefined): AdminTierId {
  if (value && VALID_TIERS.includes(value as AdminTierId)) {
    return value as AdminTierId;
  }
  return "pro";
}

/**
 * Resolve the active tenant admin context for self-service surfaces.
 * Billing will replace the env fallback once subscription tiers land.
 */
export function resolveAdminContext(): TenantAdminContext {
  const tier = parseTier(process.env.NEXT_PUBLIC_ADMIN_TIER?.trim());

  return {
    tier,
    enterpriseOverrides: undefined,
  };
}
