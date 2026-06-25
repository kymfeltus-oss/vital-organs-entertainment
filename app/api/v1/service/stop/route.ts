import { NextRequest } from "next/server";
import { withServiceAuth } from "@/lib/todays-service/route-handlers";
import { stopService } from "@/lib/todays-service/service";

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) =>
      stopService(ctx.tenantId, ctx.user.id, ctx.user.email ?? null),
    { requireBegin: true },
  );
}
