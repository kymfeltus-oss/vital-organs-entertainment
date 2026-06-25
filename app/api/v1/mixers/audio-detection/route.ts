import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { loadTodaysService, runMixerAudioDetection } from "@/lib/todays-service/service";

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{
        ipAddress: string;
        mixerType?: string;
        connectionConfig?: { port?: number; timeoutMs?: number; retryCount?: number };
      }>(request);
      if (!body.ipAddress?.trim()) throw new Error("Mixer IP address is required.");
      const result = await runMixerAudioDetection(
        ctx.tenantId,
        body,
        ctx.user.id,
        ctx.user.email ?? null,
      );
      await loadTodaysService(ctx.tenantId);
      return result;
    },
    { requireTest: true },
  );
}
