import { NextRequest } from "next/server";
import { withServiceAuth } from "@/lib/todays-service/route-handlers";
import { loadTodaysService, testSoundSection } from "@/lib/todays-service/service";

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const result = await testSoundSection(ctx.tenantId, ctx.user.id, ctx.user.email ?? null);
      await loadTodaysService(ctx.tenantId);
      return result;
    },
    { requireTest: true },
  );
}
