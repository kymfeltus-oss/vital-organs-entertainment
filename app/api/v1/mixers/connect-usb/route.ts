import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { connectUsbMixer, loadTodaysService } from "@/lib/todays-service/service";

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{
        mixerId?: string;
        name: string;
        mixerType?: string;
        usbDeviceName: string;
        usbDeviceId: string;
      }>(request);
      if (!body.usbDeviceName?.trim()) throw new Error("USB device name is required.");
      const result = await connectUsbMixer(ctx.tenantId, body, ctx.user.id, ctx.user.email ?? null);
      await loadTodaysService(ctx.tenantId);
      return result;
    },
    { requireEdit: true },
  );
}
