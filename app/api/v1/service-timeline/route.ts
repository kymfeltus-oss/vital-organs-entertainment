import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import {
  createTimelineItem,
  getOrCreateTodayService,
  listTimelineItems,
  loadTodaysService,
  reorderTimelineItems,
} from "@/lib/todays-service/service";

export async function GET(request: NextRequest) {
  return withServiceAuth(request, async (ctx) => {
    const service = await getOrCreateTodayService(ctx.tenantId);
    return { items: await listTimelineItems(service.id) };
  });
}

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{ partKey?: string; label: string; durationMinutes?: number | null }>(request);
      if (!body.label?.trim()) throw new Error("Label is required.");
      const service = await getOrCreateTodayService(ctx.tenantId);
      const item = await createTimelineItem(service.id, ctx.tenantId, {
        partKey: body.partKey ?? body.label.toLowerCase().replace(/\s+/g, "_"),
        label: body.label,
        durationMinutes: body.durationMinutes,
      });
      await loadTodaysService(ctx.tenantId);
      return { item };
    },
    { requireEdit: true },
  );
}
