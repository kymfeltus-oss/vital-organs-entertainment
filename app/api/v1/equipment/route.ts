import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import {
  createEquipment,
  getOrCreateTodayService,
  listEquipment,
  loadTodaysService,
} from "@/lib/todays-service/service";

export async function GET(request: NextRequest) {
  return withServiceAuth(request, async (ctx) => {
    const service = await getOrCreateTodayService(ctx.tenantId);
    const items = await listEquipment(service.id);
    return { items };
  });
}

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{ equipmentType: string; name: string; configJson?: Record<string, unknown> }>(
        request,
      );
      if (!body.name?.trim()) throw new Error("Name is required.");
      const service = await getOrCreateTodayService(ctx.tenantId);
      const item = await createEquipment(service.id, ctx.tenantId, body);
      await loadTodaysService(ctx.tenantId);
      return { item };
    },
    { requireEdit: true },
  );
}
