import { NextRequest } from "next/server";
import { withServiceAuth } from "@/lib/todays-service/route-handlers";
import { getLastConnectedMixerForTenant } from "@/lib/todays-service/service";

export async function GET(request: NextRequest) {
  return withServiceAuth(request, async (ctx) => {
    const mixer = await getLastConnectedMixerForTenant(ctx.tenantId);
    return { mixer };
  });
}
