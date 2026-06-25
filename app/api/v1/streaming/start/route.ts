import { NextRequest } from "next/server";
import { withServiceAuth } from "@/lib/todays-service/route-handlers";
import { prepareAndStartStreaming } from "@/lib/streaming/service";
import { loadTodaysService } from "@/lib/todays-service/service";

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const result = await prepareAndStartStreaming(ctx.tenantId, ctx.user.id, ctx.user.email ?? null);
      await loadTodaysService(ctx.tenantId);
      return result;
    },
    { requireBegin: true },
  );
}
