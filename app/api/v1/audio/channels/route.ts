import type { NextRequest } from "next/server";
import { audioForbiddenResponse, withAudioAuth, audioProxy, syncRuntimeConfig } from "@/lib/audio/route-handlers";

export async function GET(request: NextRequest) {
  return withAudioAuth(request, async (ctx) => {
    if (!ctx.permissions.canView) return audioForbiddenResponse("view audio channels") as never;
    await syncRuntimeConfig(ctx).catch(() => undefined);
    return audioProxy(ctx, "/api/v1/audio/channels");
  });
}
