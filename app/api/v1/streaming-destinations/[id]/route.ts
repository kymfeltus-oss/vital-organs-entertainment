import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { toPublicStreamingDestination } from "@/lib/streaming/map";
import {
  deleteStreamingDestinationAccount,
  getStreamingDestinationForTenant,
  updateStreamingDestinationAccount,
} from "@/lib/streaming/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withServiceAuth(
    request,
    async (ctx) => {
      const dest = await getStreamingDestinationForTenant(id, ctx.tenantId);
      if (!dest) throw new Error("Destination not found.");
      return { item: toPublicStreamingDestination(dest) };
    },
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<Record<string, unknown>>(request);
      const dest = await getStreamingDestinationForTenant(id, ctx.tenantId);
      if (!dest) throw new Error("Destination not found.");
      const item = await updateStreamingDestinationAccount(
        id,
        ctx.tenantId,
        body as Parameters<typeof updateStreamingDestinationAccount>[2],
      );
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
      const result = await deleteStreamingDestinationAccount(
        id,
        ctx.tenantId,
        ctx.user.id,
        ctx.user.email ?? null,
      );
      return result;
    },
    { requireEdit: true },
  );
}
