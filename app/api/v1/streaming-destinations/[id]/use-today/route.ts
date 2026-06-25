import { NextRequest } from "next/server";
import { withServiceAuth } from "@/lib/todays-service/route-handlers";
import { setStreamingDestinationUseToday } from "@/lib/streaming/service";
import { loadTodaysService } from "@/lib/todays-service/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withServiceAuth(
    request,
    async (ctx) => {
      await setStreamingDestinationUseToday(id, ctx.tenantId, true, ctx.user.id, ctx.user.email ?? null);
      await loadTodaysService(ctx.tenantId);
      return { success: true };
    },
    { requireEdit: true },
  );
}
