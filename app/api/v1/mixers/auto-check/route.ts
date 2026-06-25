import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { loadTodaysService, mixerAutoCheck } from "@/lib/todays-service/service";

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{
        mixerType?: string;
        usbDevices: { deviceId: string; label: string }[];
      }>(request);
      const result = await mixerAutoCheck(
        ctx.tenantId,
        { mixerType: body.mixerType, usbDevices: body.usbDevices ?? [] },
        ctx.user.id,
        ctx.user.email ?? null,
      );
      await loadTodaysService(ctx.tenantId);
      return result;
    },
    { requireTest: true },
  );
}
