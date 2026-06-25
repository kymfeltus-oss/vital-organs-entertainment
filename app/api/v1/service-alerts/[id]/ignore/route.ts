import { NextRequest } from "next/server";
import { withServiceAuth } from "@/lib/todays-service/route-handlers";
import { loadTodaysService, updateAlert } from "@/lib/todays-service/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withServiceAuth(
    request,
    async (ctx) => {
      const item = await updateAlert(id, { status: "ignored" });
      await loadTodaysService(ctx.tenantId);
      return { item };
    },
    { requireEdit: true },
  );
}
