import { NextRequest } from "next/server";
import { parseJsonBody } from "@/lib/todays-service/route-handlers";
import { withSoundAuth } from "@/lib/sound/route-handlers";
import { testDiscoveredSoundDevice } from "@/lib/sound/service";
import type { DiscoveredSoundDevice } from "@/lib/sound/types";

export async function POST(request: NextRequest) {
  return withSoundAuth(
    request,
    async () => {
      const body = await parseJsonBody<{ device: DiscoveredSoundDevice; clientVerified?: boolean }>(request);
      if (!body.device?.id) throw new Error("Select a discovered audio device.");
      return testDiscoveredSoundDevice(body.device, body.clientVerified ?? false);
    },
    { requireTest: true },
  );
}
