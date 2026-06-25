import { NextRequest } from "next/server";
import { withServiceAuth } from "@/lib/todays-service/route-handlers";
import { previewBroadcast } from "@/lib/todays-service/service";

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => previewBroadcast(ctx.tenantId, ctx.user.id, ctx.user.email ?? null),
    { requireTest: true },
  );
}
