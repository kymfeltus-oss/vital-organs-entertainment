import { NextRequest } from "next/server";
import { parseJsonBody } from "@/lib/todays-service/route-handlers";
import { withSoundAuth } from "@/lib/sound/route-handlers";
import { testSavedSoundDevice } from "@/lib/sound/service";
import { loadTodaysService } from "@/lib/todays-service/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withSoundAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{ clientVerified?: boolean }>(request);
      const result = await testSavedSoundDevice(
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
