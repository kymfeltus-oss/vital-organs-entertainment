import type { NextRequest } from "next/server";
import { audioForbiddenResponse, withAudioAuth, audioProxy, auditAudioAction } from "@/lib/audio/route-handlers";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withAudioAuth(request, async (ctx) => {
    if (!ctx.permissions.canControlBasic) return audioForbiddenResponse("solo channel") as never;
    const result = await audioProxy(ctx, `/api/v1/audio/channels/${id}/solo`, { method: "POST" });
    await auditAudioAction(ctx, "audio.channel.solo", "audio_channel", id);
    return result;
  });
}
