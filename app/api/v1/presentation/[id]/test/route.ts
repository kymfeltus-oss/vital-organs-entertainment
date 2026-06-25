import { NextRequest } from "next/server";
import { withServiceAuth } from "@/lib/todays-service/route-handlers";
import { loadTodaysService, testPresentation } from "@/lib/todays-service/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withServiceAuth(
    request,
    async (ctx) => {
      const result = await testPresentation(id, ctx.tenantId);
      await loadTodaysService(ctx.tenantId);
      return result;
    },
    { requireTest: true },
  );
}
