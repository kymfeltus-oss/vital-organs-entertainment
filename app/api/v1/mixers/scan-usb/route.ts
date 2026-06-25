import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { loadTodaysService, scanUsbMixerDevices } from "@/lib/todays-service/service";

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{ devices: { deviceId: string; label: string }[] }>(request);
      const result = await scanUsbMixerDevices(
        ctx.tenantId,
        { devices: body.devices ?? [] },
        ctx.user.id,
        ctx.user.email ?? null,
      );
      await loadTodaysService(ctx.tenantId);
      return result;
    },
    { requireTest: true },
  );
}
