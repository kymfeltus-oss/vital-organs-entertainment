import { NextRequest } from "next/server";
import { withServiceAuth } from "@/lib/todays-service/route-handlers";
import { loadTodaysService, testRecording } from "@/lib/todays-service/service";

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const result = await testRecording(ctx.tenantId);
      await loadTodaysService(ctx.tenantId);
      return result;
    },
    { requireTest: true },
  );
}
