import type { NextRequest } from "next/server";
import {
  audioForbiddenResponse,
  withAudioAuth,
  getAudioSettings,
  updateAudioSettings,
  auditAudioAction,
  syncRuntimeConfig,
} from "@/lib/audio/route-handlers";

export async function GET(request: NextRequest) {
  return withAudioAuth(request, async (ctx) => {
    if (!ctx.permissions.canView) return audioForbiddenResponse("view audio settings") as never;
    return getAudioSettings(ctx.tenantId);
  });
}

export async function PATCH(request: NextRequest) {
  return withAudioAuth(request, async (ctx) => {
    if (!ctx.permissions.canManageSettings) {
      return audioForbiddenResponse("update audio settings") as never;
    }
    const body = (await request.json()) as Record<string, unknown>;
    const settings = await updateAudioSettings(ctx.tenantId, body as never, ctx.user.id);
    await syncRuntimeConfig(ctx);
    await auditAudioAction(ctx, "audio.settings.save", "audio_settings", ctx.tenantId, body);
    return settings;
  });
}
