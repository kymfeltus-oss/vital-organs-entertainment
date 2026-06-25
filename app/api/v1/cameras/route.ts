import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { createCameraFromDiscovery } from "@/lib/cameras/service";
import { loadTodaysService } from "@/lib/todays-service/service";
import type { CreateCameraInput, DiscoveredCamera } from "@/lib/cameras/types";

export async function GET(request: NextRequest) {
  return withServiceAuth(request, async (ctx) => {
    const payload = await loadTodaysService(ctx.tenantId);
    return { items: payload.cameras };
  });
}

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<CreateCameraInput & { discovered: DiscoveredCamera; clientVerified?: boolean }>(request);
      if (!body.discovered?.id) {
        throw new Error("Select a discovered camera before saving. Placeholder cameras are not allowed.");
      }
      const item = await createCameraFromDiscovery(
        ctx.tenantId,
        ctx.user.id,
        ctx.user.email ?? null,
        body,
        body.discovered,
        body.clientVerified ?? false,
      );
      await loadTodaysService(ctx.tenantId);
      return { item };
    },
    { requireEdit: true },
  );
}
