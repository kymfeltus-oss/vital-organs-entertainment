import { NextRequest } from "next/server";
import { withSoundAuth } from "@/lib/sound/route-handlers";
import { reconnectSoundDevice } from "@/lib/sound/service";
import { loadTodaysService } from "@/lib/todays-service/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withSoundAuth(
    request,
    async (ctx) => {
      const result = await reconnectSoundDevice(id, ctx.tenantId, ctx.user.id, ctx.user.email ?? null);
      await loadTodaysService(ctx.tenantId);
      return result;
    },
    { requireEdit: true },
  );
}
