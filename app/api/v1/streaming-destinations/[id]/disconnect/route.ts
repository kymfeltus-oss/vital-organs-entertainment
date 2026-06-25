import { NextRequest } from "next/server";
import { withServiceAuth } from "@/lib/todays-service/route-handlers";
import { disconnectStreamingDestinationAccount } from "@/lib/streaming/service";
import { loadTodaysService } from "@/lib/todays-service/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withServiceAuth(
    request,
    async (ctx) => {
      const result = await disconnectStreamingDestinationAccount(id, ctx.tenantId, ctx.user.id, ctx.user.email ?? null);
      await loadTodaysService(ctx.tenantId);
      return result;
    },
    { requireEdit: true },
  );
}
