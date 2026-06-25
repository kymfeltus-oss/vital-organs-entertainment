import type { NextRequest } from "next/server";
import { audioForbiddenResponse, withAudioAuth, audioProxy, auditAudioAction } from "@/lib/audio/route-handlers";

export async function POST(request: NextRequest) {
  return withAudioAuth(request, async (ctx) => {
    if (!ctx.permissions.canControlX32) return audioForbiddenResponse("disconnect X32") as never;
    const result = await audioProxy(ctx, "/api/v1/audio/x32/disconnect", { method: "POST" });
    await auditAudioAction(ctx, "audio.x32.disconnect", "x32");
    return result;
  });
}
