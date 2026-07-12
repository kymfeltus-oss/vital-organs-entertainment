import { NextRequest } from "next/server";
import { consumeRateLimit, resolveClientIp } from "@/lib/auth/rate-limit";
import { isValidHlsUrl } from "@/lib/live/hls";
import { emitStreamStateSync } from "@/lib/owner/broadcast-stream-sync";
import { loadOwnerStreamState, updateOwnerStreamState } from "@/lib/owner/load-owner-state";
import { armMonetizationReminderScheduleOnGoLive } from "@/lib/owner/graphics-monetization-reminders";
import { LiveKitConfigError } from "@/lib/enterprise/liv-golf/livekit-config";
import {
  mergeLivLiveKitBroadcastPreset,
  readLivLiveKitBroadcastState,
  startLivRoomCompositeHlsEgress,
  isLiveKitConcurrentEgressLimitError,
} from "@/lib/enterprise/liv-golf/livekit-server";
import { requireOwnerUser } from "@/lib/owner/auth";
import { isOwnerAuthed, ownerAuthFailureResponse, ownerJsonResponse } from "@/lib/owner/api-response";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type StartBody = {
  roomName?: unknown;
  participantIdentity?: unknown;
  confirm?: unknown;
};

function parseStartBody(body: unknown): {
  roomName?: string;
  participantIdentity?: string;
  confirm: boolean;
} | null {
  if (!body || typeof body !== "object") return null;
  const record = body as StartBody;
  return {
    roomName: typeof record.roomName === "string" ? record.roomName.trim() : undefined,
    participantIdentity:
      typeof record.participantIdentity === "string"
        ? record.participantIdentity.trim()
        : undefined,
    confirm: record.confirm === true,
  };
}

/** Start LiveKit room composite HLS egress and open the LIV fan viewport gate. */
export async function POST(request: Request) {
  const ip = resolveClientIp(request as NextRequest);
  const limit = await consumeRateLimit("liv-livekit-egress-start", ip, { limit: 8, windowMs: 60_000 });
  if (!limit.allowed) {
    return ownerJsonResponse({ success: false, error: "Too many egress start attempts." }, 429);
  }

  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return ownerJsonResponse({ success: false, error: "Invalid JSON body." }, 400);
  }

  const parsed = parseStartBody(body);
  if (!parsed) {
    return ownerJsonResponse({ success: false, error: "Invalid egress start body." }, 400);
  }

  if (!parsed.confirm) {
    return ownerJsonResponse(
      {
        success: false,
        error: "Egress start requires confirm: true after the in-app publisher is live.",
      },
      400,
    );
  }

  const admin = getSupabaseAdmin();

  try {
    const { row } = await loadOwnerStreamState(admin);
    if (row?.is_live) {
      await emitStreamStateSync();
      return ownerJsonResponse({
        success: true,
        alreadyLive: true,
        hlsManifestUrl: row.primary_playback_url ?? row.playback_url,
        message: "Broadcast is already live on the platform.",
      });
    }

    const livekitState = readLivLiveKitBroadcastState(row?.audio_master_presets);
    const knownEgressIds = [
      livekitState?.egressId,
      row?.publisher_session_id,
    ].filter((id): id is string => typeof id === "string" && id.trim() !== "");

    const egress = await startLivRoomCompositeHlsEgress({
      roomName: parsed.roomName,
      knownEgressIds,
    });

    if (!isValidHlsUrl(egress.hlsManifestUrl)) {
      return ownerJsonResponse(
        {
          success: false,
          error: "Generated HLS manifest URL failed validation.",
        },
        500,
      );
    }

    const presets = mergeLivLiveKitBroadcastPreset(row?.audio_master_presets, {
      egressId: egress.egressId,
      roomName: egress.roomName,
      hlsManifestUrl: egress.hlsManifestUrl,
      filenamePrefix: egress.filenamePrefix,
      participantIdentity: parsed.participantIdentity ?? null,
      startedAt: new Date().toISOString(),
      endedAt: null,
    });

    const liveUpdate = await updateOwnerStreamState(admin, {
      publish_mode: "livekit_hls",
      publish_status: "publishing",
      publish_error_message: null,
      playback_status: "playback_pending",
      playback_error_message: null,
      is_live: true,
      attendee_ui_phase: "live",
      active_source: "primary",
      primary_playback_url: egress.hlsManifestUrl,
      playback_url: egress.hlsManifestUrl,
      publisher_session_id: egress.egressId,
      publisher_channel: egress.roomName,
      audio_master_presets: presets,
      updated_by: auth.email,
    });

    if (liveUpdate.error || liveUpdate.row?.is_live !== true) {
      return ownerJsonResponse(
        {
          success: false,
          error: liveUpdate.error ?? "Unable to mark LIV broadcast live in live_stream_state.",
        },
        500,
      );
    }

    await armMonetizationReminderScheduleOnGoLive(admin, auth.email);
    await emitStreamStateSync();

    return ownerJsonResponse({
      success: true,
      egressId: egress.egressId,
      roomName: egress.roomName,
      hlsManifestUrl: egress.hlsManifestUrl,
      publishStatus: "publishing",
      isLive: true,
      message:
        "LiveKit HLS egress started. Fan viewports on /enterprise/liv-golf/live will open as segments publish.",
    });
  } catch (error) {
    if (error instanceof LiveKitConfigError) {
      return ownerJsonResponse({ success: false, error: error.message }, 503);
    }

    if (isLiveKitConcurrentEgressLimitError(error)) {
      return ownerJsonResponse(
        {
          success: false,
          error:
            "LiveKit allows 2 concurrent egress sessions on this plan and both slots are in use. Click End Broadcast (it stops all active egress), wait until the status says slots are released (~30s), then try Open to Fans again.",
        },
        429,
      );
    }

    if (error instanceof LiveKitConfigError && /egress slots still in use/i.test(error.message)) {
      return ownerJsonResponse({ success: false, error: error.message }, 429);
    }

    const detail = error instanceof Error ? error.message : "LiveKit egress start failed.";
    console.error("[enterprise/liv-golf/livekit/egress/start] POST failed:", detail);
    return ownerJsonResponse({ success: false, error: detail }, 500);
  }
}
