import { NextRequest } from "next/server";
import { parseJsonBody } from "@/lib/todays-service/route-handlers";
import { withSoundAuth } from "@/lib/sound/route-handlers";
import { createSoundFromDiscovery } from "@/lib/sound/service";
import { loadTodaysService } from "@/lib/todays-service/service";
import type { CreateSoundDeviceInput, DiscoveredSoundDevice } from "@/lib/sound/types";

export async function GET(request: NextRequest) {
  return withSoundAuth(request, async (ctx) => {
    const payload = await loadTodaysService(ctx.tenantId);
    return { items: payload.soundItems };
  });
}

export async function POST(request: NextRequest) {
  return withSoundAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<
        CreateSoundDeviceInput & {
          discovered: DiscoveredSoundDevice;
          clientVerified?: boolean;
          clientTest?: import("@/lib/sound/types").SoundTestResult;
        }
      >(request);
      if (!body.discovered?.id) {
        throw new Error("Select a discovered audio device before saving. Placeholder devices are not allowed.");
      }
      const item = await createSoundFromDiscovery(
        ctx.tenantId,
        ctx.user.id,
        ctx.user.email ?? null,
        body,
        body.discovered,
        body.clientVerified ?? false,
        body.clientTest,
      );
      await loadTodaysService(ctx.tenantId);
      return { item };
    },
    { requireEdit: true, successStatus: 201 },
  );
}
