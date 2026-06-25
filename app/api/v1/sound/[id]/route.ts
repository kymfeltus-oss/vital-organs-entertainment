import { NextRequest } from "next/server";
import { parseJsonBody } from "@/lib/todays-service/route-handlers";
import { withSoundAuth } from "@/lib/sound/route-handlers";
import { deleteSoundDeviceAccount, updateSoundDeviceAccount } from "@/lib/sound/service";
import { loadTodaysService } from "@/lib/todays-service/service";
import type { UpdateSoundDeviceInput } from "@/lib/sound/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withSoundAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<UpdateSoundDeviceInput>(request);
      const item = await updateSoundDeviceAccount(id, ctx.tenantId, ctx.user.id, ctx.user.email ?? null, body);
      await loadTodaysService(ctx.tenantId);
      return { item };
    },
    { requireEdit: true },
  );
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withSoundAuth(
    request,
    async (ctx) => {
      await deleteSoundDeviceAccount(id, ctx.tenantId, ctx.user.id, ctx.user.email ?? null);
      await loadTodaysService(ctx.tenantId);
      return { success: true };
    },
    { requireEdit: true },
  );
}
