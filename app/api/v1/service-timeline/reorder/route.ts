import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { getOrCreateTodayService, loadTodaysService, reorderTimelineItems } from "@/lib/todays-service/service";

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{ orderedIds: string[] }>(request);
      if (!Array.isArray(body.orderedIds) || body.orderedIds.length === 0) {
        throw new Error("Ordered list is required.");
      }
      const service = await getOrCreateTodayService(ctx.tenantId);
      const items = await reorderTimelineItems(service.id, body.orderedIds);
      await loadTodaysService(ctx.tenantId);
      return { items };
    },
    { requireEdit: true },
  );
}
