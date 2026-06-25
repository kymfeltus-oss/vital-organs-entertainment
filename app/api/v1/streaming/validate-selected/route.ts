import { NextRequest } from "next/server";
import { withServiceAuth } from "@/lib/todays-service/route-handlers";
import { validateStreamingForGoLive } from "@/lib/streaming/service";

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => validateStreamingForGoLive(ctx.tenantId),
    { requireTest: true },
  );
}
