import { NextRequest } from "next/server";
import { parseJsonBody, withInternetAuth } from "@/lib/internet/route-handlers";
import { deleteInternetConnection, loadTodaysService, updateInternetConnection } from "@/lib/todays-service/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withInternetAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<Record<string, unknown>>(request);
      const item = await updateInternetConnection(id, body as Parameters<typeof updateInternetConnection>[1]);
      await loadTodaysService(ctx.tenantId);
      return { item };
    },
    { requireEdit: true },
  );
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withInternetAuth(
    request,
    async (ctx) => {
      await deleteInternetConnection(id);
      await loadTodaysService(ctx.tenantId);
      return { success: true };
    },
    { requireEdit: true },
  );
}
