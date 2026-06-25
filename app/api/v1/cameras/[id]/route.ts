import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { deleteCameraAccount, getCameraForTenant, updateCameraAccount } from "@/lib/cameras/service";
import { loadTodaysService } from "@/lib/todays-service/service";
import type { UpdateCameraInput } from "@/lib/cameras/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withServiceAuth(request, async (ctx) => {
    const item = await getCameraForTenant(id, ctx.tenantId);
    if (!item) throw new Error("Camera not found.");
    return { item };
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<UpdateCameraInput>(request);
      const item = await updateCameraAccount(id, ctx.tenantId, ctx.user.id, ctx.user.email ?? null, body);
      await loadTodaysService(ctx.tenantId);
      return { item };
    },
    { requireEdit: true },
  );
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withServiceAuth(
    request,
    async (ctx) => {
      await deleteCameraAccount(id, ctx.tenantId, ctx.user.id, ctx.user.email ?? null);
      await loadTodaysService(ctx.tenantId);
      return { success: true };
    },
    { requireEdit: true },
  );
}
