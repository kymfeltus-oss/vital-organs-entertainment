import { NextRequest } from "next/server";
import { parseJsonBody } from "@/lib/todays-service/route-handlers";
import { withSoundAuth } from "@/lib/sound/route-handlers";
import { discoverAllSoundDevices } from "@/lib/sound/service";
import type { DiscoveredSoundDevice } from "@/lib/sound/types";

export async function POST(request: NextRequest) {
  return withSoundAuth(request, async (ctx) => {
    const body = await parseJsonBody<{ clientDevices?: DiscoveredSoundDevice[] }>(request);
    return discoverAllSoundDevices(body.clientDevices ?? []);
  });
}
