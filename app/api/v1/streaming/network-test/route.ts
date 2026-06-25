import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { runStreamingNetworkTest } from "@/lib/streaming/service";

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{ destinationId: string; videoProfile?: Record<string, unknown> }>(request);
      if (!body.destinationId) throw new Error("destinationId is required.");
      const result = await runStreamingNetworkTest(
        ctx.tenantId,
        body.destinationId,
        ctx.user.id,
        ctx.user.email ?? null,
        body.videoProfile,
      );
      return { result };
    },
    { requireEdit: true },
  );
}
