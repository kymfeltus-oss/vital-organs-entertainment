import { NextRequest } from "next/server";
import { withServiceAuth } from "@/lib/todays-service/route-handlers";
import { getOrCreateTodayService, listAlerts } from "@/lib/todays-service/service";

export async function GET(request: NextRequest) {
  return withServiceAuth(request, async (ctx) => {
    const service = await getOrCreateTodayService(ctx.tenantId);
    return { items: await listAlerts(service.id) };
  });
}
