import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import {
  listBroadcastDestinationCards,
  saveBroadcastDestinationSelections,
} from "@/lib/streaming/broadcast-destinations";
import { loadTodaysService } from "@/lib/todays-service/service";
import type { StreamingPlatform } from "@/lib/streaming/types";

export async function GET(request: NextRequest) {
  return withServiceAuth(request, async (ctx) => {
    const result = await listBroadcastDestinationCards(ctx.tenantId);
    return result;
  });
}

export async function PUT(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{ platforms: StreamingPlatform[] }>(request);
      if (!Array.isArray(body.platforms)) throw new Error("platforms array is required.");
      const result = await saveBroadcastDestinationSelections(
        ctx.tenantId,
        ctx.user.id,
        ctx.user.email ?? null,
        body.platforms,
      );
      await loadTodaysService(ctx.tenantId);
      return result;
    },
    { requireEdit: true },
  );
}
