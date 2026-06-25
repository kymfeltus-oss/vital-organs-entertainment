import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { loadTodaysService, patchMixerConnection } from "@/lib/todays-service/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{
        connectionType?: string;
        ethernetIpAddress?: string;
        usbDeviceName?: string;
        usbDeviceId?: string;
        lastConnectionMethod?: string;
        connectionStatus?: string;
      }>(request);
      const mixer = await patchMixerConnection(
        ctx.tenantId,
        id,
        body as Parameters<typeof patchMixerConnection>[2],
        ctx.user.id,
        ctx.user.email ?? null,
      );
      await loadTodaysService(ctx.tenantId);
      return { mixer };
    },
    { requireEdit: true },
  );
}
