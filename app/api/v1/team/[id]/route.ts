import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { deleteTeamMember, loadTodaysService, updateTeamMember } from "@/lib/todays-service/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<Record<string, unknown>>(request);
      const item = await updateTeamMember(id, body as Parameters<typeof updateTeamMember>[1]);
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
      await deleteTeamMember(id);
      await loadTodaysService(ctx.tenantId);
      return { success: true };
    },
    { requireEdit: true },
  );
}
