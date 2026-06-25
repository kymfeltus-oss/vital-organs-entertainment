import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { getStreamingDestinationForTenant } from "@/lib/streaming/service";
import { getStreamingDestinationSecrets } from "@/lib/todays-service/repository";
import { prepareLocalEncoder } from "@/lib/streaming/encoder";

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{ destinationId: string }>(request);
      if (!body.destinationId) throw new Error("destinationId is required.");
      const dest = await getStreamingDestinationForTenant(body.destinationId, ctx.tenantId);
      if (!dest) throw new Error("Destination not found.");
      const secrets = await getStreamingDestinationSecrets(body.destinationId);
      const result = await prepareLocalEncoder({
        destinationId: body.destinationId,
        streamUrl: secrets?.streamUrl ?? null,
        streamKey: secrets?.streamKey ?? null,
      });
      return result;
    },
    { requireEdit: true },
  );
}
