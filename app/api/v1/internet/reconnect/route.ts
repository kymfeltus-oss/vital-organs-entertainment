import { NextRequest } from "next/server";
import { withInternetAuth } from "@/lib/internet/route-handlers";
import { loadTodaysService, reconnectPreferredInternet } from "@/lib/todays-service/service";

export async function POST(request: NextRequest) {
  return withInternetAuth(
    request,
    async (ctx) => {
      const result = await reconnectPreferredInternet(ctx.tenantId);
      await loadTodaysService(ctx.tenantId);
      return result;
    },
    { requireEdit: true },
  );
}
