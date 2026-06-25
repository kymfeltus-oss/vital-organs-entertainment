import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { testCameraAccount } from "@/lib/cameras/service";
import { loadTodaysService } from "@/lib/todays-service/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{ clientVerified?: boolean }>(request).catch(() => ({ clientVerified: false }));
      const result = await testCameraAccount(
        id,
        ctx.tenantId,
        ctx.user.id,
        ctx.user.email ?? null,
        body.clientVerified ?? false,
      );
      await loadTodaysService(ctx.tenantId);
      return result;
    },
    { requireTest: true },
  );
}
