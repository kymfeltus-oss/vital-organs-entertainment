import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { beginService } from "@/lib/todays-service/service";

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{ force?: boolean; skipDestinationIds?: string[] }>(request);
      return beginService(
        ctx.tenantId,
        ctx.user.id,
        ctx.user.email ?? null,
        body.force ?? false,
        body.skipDestinationIds ?? [],
      );
    },
    { requireBegin: true },
  );
}
