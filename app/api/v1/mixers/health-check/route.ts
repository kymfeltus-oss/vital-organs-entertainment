import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { loadTodaysService, runMixerHealthCheck } from "@/lib/todays-service/service";

import type { MixerConnectionType } from "@/lib/todays-service/types";

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{
        mixerId?: string;
        ipAddress?: string;
        mixerType?: string;
        connectionType?: MixerConnectionType;
        usbDeviceName?: string | null;
        connectionConfig?: { port?: number; timeoutMs?: number; retryCount?: number };
      }>(request);
      const result = await runMixerHealthCheck(
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
