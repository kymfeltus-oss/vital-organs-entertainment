import { NextRequest } from "next/server";
import { withInternetAuth } from "@/lib/internet/route-handlers";
import { detectInternet } from "@/lib/todays-service/service";

export async function GET(request: NextRequest) {
  return withInternetAuth(request, async (ctx) => detectInternet(ctx.tenantId));
}
