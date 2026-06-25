import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { discoverAllCameras } from "@/lib/cameras/service";
import type { DiscoveredCamera } from "@/lib/cameras/types";

export async function POST(request: NextRequest) {
  return withServiceAuth(request, async () => {
    const body = await parseJsonBody<{ clientDevices?: DiscoveredCamera[] }>(request);
    return discoverAllCameras(body.clientDevices ?? []);
  });
}
