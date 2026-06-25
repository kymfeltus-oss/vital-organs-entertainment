import type { NextRequest } from "next/server";
import { audioForbiddenResponse, withAudioAuth, audioProxy } from "@/lib/audio/route-handlers";

export async function POST(request: NextRequest) {
  return withAudioAuth(request, async (ctx) => {
    if (!ctx.permissions.canControlX32) return audioForbiddenResponse("test X32 connection") as never;
    return audioProxy(ctx, "/api/v1/audio/x32/test", { method: "POST" });
  });
}
