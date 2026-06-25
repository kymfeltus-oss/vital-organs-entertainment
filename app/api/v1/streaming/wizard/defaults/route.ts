import { NextRequest } from "next/server";
import { withServiceAuth } from "@/lib/todays-service/route-handlers";
import { getStreamingWizardDefaults } from "@/lib/streaming/service";

export async function GET(request: NextRequest) {
  return withServiceAuth(request, async (ctx) => {
    const defaults = await getStreamingWizardDefaults(ctx.tenantId);
    return { defaults };
  });
}
