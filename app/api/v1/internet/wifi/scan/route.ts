import { NextRequest } from "next/server";
import { withInternetAuth } from "@/lib/internet/route-handlers";
import { scanWifiNetworks } from "@/lib/todays-service/service";

export async function GET(request: NextRequest) {
  return withInternetAuth(request, async () => {
    const networks = await scanWifiNetworks();
    return { networks };
  });
}
