import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { testDiscoveredDevice } from "@/lib/cameras/service";
import type { DiscoveredCamera } from "@/lib/cameras/types";

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async () => {
      const body = await parseJsonBody<{ device: DiscoveredCamera; networkPassword?: string | null }>(request);
      if (!body.device?.id) throw new Error("Select a camera to test.");
      return testDiscoveredDevice(body.device, body.networkPassword);
    },
    { requireTest: true },
  );
}
