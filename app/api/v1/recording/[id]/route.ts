import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { deleteRecordingSetting, getOrCreateTodayService, loadTodaysService, upsertRecordingSetting } from "@/lib/todays-service/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<Record<string, unknown>>(request);
      const service = await getOrCreateTodayService(ctx.tenantId);
      const item = await upsertRecordingSetting(service.id, ctx.tenantId, { ...body, id } as Parameters<typeof upsertRecordingSetting>[2]);
      await loadTodaysService(ctx.tenantId);
      return { item };
    },
    { requireEdit: true },
  );
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withServiceAuth(
    request,
    async (ctx) => {
      await deleteRecordingSetting(id);
      await loadTodaysService(ctx.tenantId);
      return { success: true };
    },
    { requireEdit: true },
  );
}
