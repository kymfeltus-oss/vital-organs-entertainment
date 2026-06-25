import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { loadTodaysService, patchTodaysServiceHeader } from "@/lib/todays-service/service";

export async function GET(request: NextRequest) {
  return withServiceAuth(request, async (ctx) => {
    const payload = await loadTodaysService(ctx.tenantId, undefined, { purpose: "display" });
    return payload;
  });
}

export async function PATCH(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body =       await parseJsonBody<{
        id?: string;
        serviceName?: string;
        serviceDate?: string;
        serviceStartTime?: string;
        broadcastProfile?: string;
        readinessMessage?: string;
        countdownEnabled?: boolean;
      }>(request);

      const updated = await patchTodaysServiceHeader(ctx.tenantId, body);
      return loadTodaysService(ctx.tenantId, updated.id);
    },
    { requireEdit: true },
  );
}

export async function POST(request: NextRequest) {
  return withServiceAuth(request, async (ctx) => {
    const body = await parseJsonBody<{ action?: string }>(request);
    if (body.action === "refresh") {
      return loadTodaysService(ctx.tenantId);
    }
    return loadTodaysService(ctx.tenantId);
  });
}
