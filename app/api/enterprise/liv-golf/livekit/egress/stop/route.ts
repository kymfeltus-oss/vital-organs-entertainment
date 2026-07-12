import { NextRequest } from "next/server";
import { consumeRateLimit, resolveClientIp } from "@/lib/auth/rate-limit";
import { emitStreamStateSync } from "@/lib/owner/broadcast-stream-sync";
import { loadOwnerStreamState, updateOwnerStreamState } from "@/lib/owner/load-owner-state";
import { LiveKitConfigError } from "@/lib/enterprise/liv-golf/livekit-config";
import {
  clearActiveLiveKitEgressSessions,
  mergeLivLiveKitBroadcastPreset,
  readLivLiveKitBroadcastState,
} from "@/lib/enterprise/liv-golf/livekit-server";
import { requireOwnerUser } from "@/lib/owner/auth";
import { isOwnerAuthed, ownerAuthFailureResponse, ownerJsonResponse } from "@/lib/owner/api-response";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type StopBody = {
  egressId?: unknown;
  confirm?: unknown;
};

function parseStopBody(body: unknown): { egressId?: string; confirm: boolean } | null {
  if (!body || typeof body !== "object") return null;
  const record = body as StopBody;
  return {
    egressId: typeof record.egressId === "string" ? record.egressId.trim() : undefined,
    confirm: record.confirm === true,
  };
}

/** Stop LiveKit egress and settle the LIV broadcast to ended/offline. */
export async function POST(request: Request) {
  const ip = resolveClientIp(request as NextRequest);
  const limit = await consumeRateLimit("liv-livekit-egress-stop", ip, { limit: 12, windowMs: 60_000 });
  if (!limit.allowed) {
    return ownerJsonResponse({ success: false, error: "Too many egress stop attempts." }, 429);
  }

  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return ownerJsonResponse({ success: false, error: "Invalid JSON body." }, 400);
  }

  const parsed = parseStopBody(body);
  if (!parsed) {
    return ownerJsonResponse({ success: false, error: "Invalid egress stop body." }, 400);
  }

  if (!parsed.confirm) {
    return ownerJsonResponse(
      { success: false, error: "Egress stop requires confirm: true." },
      400,
    );
  }

  const admin = getSupabaseAdmin();

  try {
    const { row } = await loadOwnerStreamState(admin);
    const livekitState = readLivLiveKitBroadcastState(row?.audio_master_presets);
    const egressId = parsed.egressId || livekitState?.egressId || row?.publisher_session_id || "";

    const cleared = await clearActiveLiveKitEgressSessions({
      roomName: livekitState?.roomName ?? row?.publisher_channel ?? undefined,
      knownEgressIds: egressId ? [egressId] : [],
    });

    const egressAlreadyTerminal = false;

    const presets = mergeLivLiveKitBroadcastPreset(row?.audio_master_presets, {
      egressId: null,
      endedAt: new Date().toISOString(),
    });

    const offlineUpdate = await updateOwnerStreamState(admin, {
      is_live: false,
      attendee_ui_phase: "ended",
      active_source: "offline",
      publish_mode: "none",
      publish_status: "offline",
      publish_error_message: egressAlreadyTerminal
        ? "LiveKit egress ended in a failed state. Verify S3 upload permissions and retry Open to Fans."
        : cleared.remainingActiveIds.length > 0
          ? `LiveKit is still releasing egress slot(s): ${cleared.remainingActiveIds.join(", ")}. Wait ~30s before retrying.`
          : null,
      playback_status: "ready",
      playback_error_message: null,
      primary_playback_url: null,
      playback_url: null,
      publisher_session_id: null,
      publisher_channel: null,
      audio_master_presets: presets,
      updated_by: auth.email,
    });

    if (offlineUpdate.error || offlineUpdate.row?.is_live === true) {
      return ownerJsonResponse(
        {
          success: false,
          error: offlineUpdate.error ?? "Unable to settle broadcast to ended phase.",
        },
        500,
      );
    }

    await emitStreamStateSync();

    return ownerJsonResponse({
      success: true,
      egressId: egressId || cleared.stoppedIds[0] || null,
      clearedEgressIds: cleared.stoppedIds,
      remainingActiveEgressIds: cleared.remainingActiveIds,
      publishStatus: "offline",
      attendeeUiPhase: "ended",
      egressAlreadyTerminal,
      message: cleared.remainingActiveIds.length > 0
        ? `Stopped ${cleared.stoppedIds.length} egress session(s). LiveKit is still releasing ${cleared.remainingActiveIds.length} slot(s) — wait ~30s before Open to Fans.`
        : egressAlreadyTerminal
          ? "LiveKit egress had already failed or ended. Broadcast settled to offline."
          : cleared.stoppedIds.length > 1
            ? `Stopped ${cleared.stoppedIds.length} LiveKit egress sessions and settled broadcast to ended.`
            : "LiveKit egress stopped and broadcast settled to ended.",
    });
  } catch (error) {
    if (error instanceof LiveKitConfigError) {
      return ownerJsonResponse({ success: false, error: error.message }, 503);
    }

    const detail = error instanceof Error ? error.message : "LiveKit egress stop failed.";
    console.error("[enterprise/liv-golf/livekit/egress/stop] POST failed:", detail);
    return ownerJsonResponse({ success: false, error: detail }, 500);
  }
}
