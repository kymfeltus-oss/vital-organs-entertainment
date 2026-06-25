import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { connectEthernetMixer, loadTodaysService } from "@/lib/todays-service/service";

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{
        mixerId?: string;
        name: string;
        ipAddress: string;
        mixerType?: string;
        connectionConfig?: { port?: number; timeoutMs?: number; retryCount?: number };
      }>(request);
      if (!body.name?.trim()) throw new Error("Mixer name is required.");
      const result = await connectEthernetMixer(ctx.tenantId, body, ctx.user.id, ctx.user.email ?? null);
      await loadTodaysService(ctx.tenantId);
      return result;
    },
    { requireEdit: true },
  );
}
