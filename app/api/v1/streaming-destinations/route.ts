import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { createStreamingDestinationAccount, listPublicStreamingDestinations } from "@/lib/streaming/service";
import { loadTodaysService } from "@/lib/todays-service/service";
import type { CreateStreamingDestinationInput } from "@/lib/streaming/types";

export async function GET(request: NextRequest) {
  return withServiceAuth(request, async (ctx) => ({
    items: await listPublicStreamingDestinations(ctx.tenantId),
  }));
}

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<CreateStreamingDestinationInput>(request);
      const item = await createStreamingDestinationAccount(
        ctx.tenantId,
        ctx.user.id,
        ctx.user.email ?? null,
        body,
      );
      await loadTodaysService(ctx.tenantId);
      return { item };
    },
    { requireEdit: true },
  );
}
