import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { getTenantEquipmentProfile, loadTodaysService, upsertTenantEquipmentProfile } from "@/lib/todays-service/service";

export async function GET(request: NextRequest) {
  return withServiceAuth(request, async (ctx) => {
    const profile = await getTenantEquipmentProfile(ctx.tenantId);
    await loadTodaysService(ctx.tenantId);
    return { profile };
  });
}

export async function PATCH(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{
        preferredConnectionType?: string | null;
        rememberConnectionChoice?: boolean;
        preferredNetwork?: import("@/lib/internet/types").PreferredChurchNetwork | null;
        onboarding?: Record<string, unknown>;
      }>(request);
      const profile = await upsertTenantEquipmentProfile(ctx.tenantId, body);
      await loadTodaysService(ctx.tenantId);
      return { profile };
    },
    { requireEdit: true },
  );
}
