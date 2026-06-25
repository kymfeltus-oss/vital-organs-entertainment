import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { deleteTimelineItem, loadTodaysService, updateTimelineItem } from "@/lib/todays-service/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{ label?: string; durationMinutes?: number | null; sortOrder?: number }>(request);
      const item = await updateTimelineItem(id, body);
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
      await deleteTimelineItem(id);
      await loadTodaysService(ctx.tenantId);
      return { success: true };
    },
    { requireEdit: true },
  );
}
