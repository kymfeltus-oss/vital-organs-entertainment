import { NextRequest } from "next/server";
import { withServiceAuth } from "@/lib/todays-service/route-handlers";
import { validateStreamingDestination } from "@/lib/streaming/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withServiceAuth(
    request,
    async (ctx) => {
      const result = await validateStreamingDestination(id, ctx.tenantId, ctx.user.id, ctx.user.email ?? null);
      return { success: result.success, message: result.message, validation: result.validation, details: result };
    },
    { requireTest: true },
  );
}
