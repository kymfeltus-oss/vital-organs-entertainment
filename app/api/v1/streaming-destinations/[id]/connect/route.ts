import { NextRequest } from "next/server";
import { withServiceAuth } from "@/lib/todays-service/route-handlers";
import { testStreamingDestinationAccount } from "@/lib/streaming/service";
import { loadTodaysService } from "@/lib/todays-service/service";

type RouteContext = { params: Promise<{ id: string }> };

/** Validate credentials and mark destination connected/ready. */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withServiceAuth(
    request,
    async (ctx) => {
      const result = await testStreamingDestinationAccount(
        id,
        ctx.tenantId,
        ctx.user.id,
        ctx.user.email ?? null,
      );
      await loadTodaysService(ctx.tenantId);
      return {
        success: result.success,
        message: result.message,
        connectionStatus: result.connectionStatus,
        steps: result.steps,
      };
    },
    { requireEdit: true },
  );
}
