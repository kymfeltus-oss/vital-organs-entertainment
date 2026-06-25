import { NextRequest } from "next/server";
import { withInternetAuth } from "@/lib/internet/route-handlers";
import { loadTodaysService, runInternetSpeedTest } from "@/lib/todays-service/service";

export async function POST(request: NextRequest) {
  return withInternetAuth(
    request,
    async (ctx) => {
      const result = await runInternetSpeedTest(ctx.tenantId);
      await loadTodaysService(ctx.tenantId);
      return result;
    },
    { requireTest: true },
  );
}
