import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  audioForbiddenResponse,
  requireAudioApiUser,
  type AudioAuthContext,
} from "@/lib/audio/auth";
import {
  getAudioSettings,
  listChannelMappings,
  updateAudioSettings,
  upsertChannelMapping,
  writeAudioAuditLog,
} from "@/lib/audio/repository";
import { AudioServiceError, proxyAudioService } from "@/lib/audio/service-proxy";

export async function withAudioAuth<T>(
  request: NextRequest,
  handler: (ctx: AudioAuthContext) => Promise<T>,
  forbiddenAction?: string,
): Promise<NextResponse> {
  const gate = await requireAudioApiUser(request);
  if (gate.response || !gate.context) return gate.response;

  try {
    const result = await handler(gate.context);
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AudioServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[AUDIO_API_ERR]:", error);
    return NextResponse.json({ error: "Audio request failed." }, { status: 500 });
  }
}

export function audioProxy(ctx: AudioAuthContext, path: string, init?: RequestInit) {
  return proxyAudioService(path, {
    method: init?.method,
    body: init?.body ? JSON.parse(String(init.body)) : undefined,
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    userEmail: ctx.user.email,
  });
}

export async function syncRuntimeConfig(ctx: AudioAuthContext) {
  const [settings, mappings] = await Promise.all([
    getAudioSettings(ctx.tenantId),
    listChannelMappings(ctx.tenantId),
  ]);

  await proxyAudioService("/api/v1/audio/runtime/settings", {
    method: "PATCH",
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    body: settings,
  });

  await proxyAudioService("/api/v1/audio/runtime/mappings", {
    method: "POST",
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    body: mappings.map((mapping) => ({
      x32Channel: mapping.x32Channel,
      displayName: mapping.displayName,
      roleKey: mapping.roleKey,
      wireless: mapping.wireless,
      wirelessChannel: mapping.wirelessChannel,
      backupAvailable: mapping.backupAvailable,
      wirelessBatteryPct: null,
      wirelessRf: null,
    })),
  });
}

export async function auditAudioAction(
  ctx: AudioAuthContext,
  action: string,
  targetType: string,
  targetId?: string,
  metadata?: Record<string, unknown>,
) {
  const settings = await getAudioSettings(ctx.tenantId);
  if (!settings.enableAuditLogging) return;

  await writeAudioAuditLog({
    tenantId: ctx.tenantId,
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    action,
    targetType,
    targetId,
    metadata,
  });
}

export { audioForbiddenResponse, getAudioSettings, updateAudioSettings, upsertChannelMapping };
