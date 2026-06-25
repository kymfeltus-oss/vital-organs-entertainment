import type { NextRequest } from "next/server";
import { audioForbiddenResponse, withAudioAuth, audioProxy, auditAudioAction } from "@/lib/audio/route-handlers";

type RouteContext = { params: Promise<{ id: string }> };

async function channelAction(
  request: NextRequest,
  context: RouteContext,
  action: "mute" | "unmute" | "solo" | "unsolo",
) {
  const { id } = await context.params;
  return withAudioAuth(request, async (ctx) => {
    if (!ctx.permissions.canControlBasic) {
      return audioForbiddenResponse(`${action} channel`) as never;
    }
    const result = await audioProxy(ctx, `/api/v1/audio/channels/${id}/${action}`, { method: "POST" });
    await auditAudioAction(ctx, `audio.channel.${action}`, "audio_channel", id);
    return result;
  });
}

export async function POST(
  request: NextRequest,
  context: RouteContext & { params: Promise<{ id: string; action?: string }> },
) {
  const pathname = request.nextUrl.pathname;
  if (pathname.endsWith("/mute")) return channelAction(request, context, "mute");
  if (pathname.endsWith("/unmute")) return channelAction(request, context, "unmute");
  if (pathname.endsWith("/solo")) return channelAction(request, context, "solo");
  if (pathname.endsWith("/unsolo")) return channelAction(request, context, "unsolo");
  return withAudioAuth(request, async () => ({ error: "Not found" }));
}
