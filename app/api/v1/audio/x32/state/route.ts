import type { NextRequest } from "next/server";
import { audioForbiddenResponse, withAudioAuth, audioProxy } from "@/lib/audio/route-handlers";

export async function GET(request: NextRequest) {
  return withAudioAuth(request, async (ctx) => {
    if (!ctx.permissions.canView) return audioForbiddenResponse("view X32 state") as never;
    return audioProxy(ctx, "/api/v1/audio/x32/state");
  });
}
