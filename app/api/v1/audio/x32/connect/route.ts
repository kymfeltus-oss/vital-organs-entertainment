import type { NextRequest } from "next/server";
import { audioForbiddenResponse, withAudioAuth, audioProxy, auditAudioAction, syncRuntimeConfig } from "@/lib/audio/route-handlers";

export async function POST(request: NextRequest) {
  return withAudioAuth(request, async (ctx) => {
    if (!ctx.permissions.canControlX32) return audioForbiddenResponse("connect X32") as never;
    await syncRuntimeConfig(ctx);
    const result = await audioProxy(ctx, "/api/v1/audio/x32/connect", { method: "POST" });
    await auditAudioAction(ctx, "audio.x32.connect", "x32");
    return result;
  });
}
