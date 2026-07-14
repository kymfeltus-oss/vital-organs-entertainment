import type { SupabaseClient } from "@supabase/supabase-js";
import type { GoLiveRequestBody, OwnerBroadcastSnapshot, PublishMode, SwitchFeedRequestBody } from "@/lib/owner/contracts";
import { buildOwnerBroadcastSnapshot } from "@/lib/owner/build-broadcast-snapshot";
import { emitStreamStateSync } from "@/lib/owner/broadcast-stream-sync";
import { resolvePrimaryRtmpIngestUrl } from "@/lib/owner/broadcast-engine-fallbacks";
import { resolvePrimaryFeedUrl, seedFeedUrlsFromEnv } from "@/lib/owner/feed-urls";
import { isFatalHlsProbeFailure, probeHlsManifest } from "@/lib/owner/hls-readiness";
import { loadOwnerStreamState, updateOwnerStreamState } from "@/lib/owner/load-owner-state";
import { preserveOfflinePlaybackFields } from "@/lib/owner/offline-stream-state";
import {
  buildPreflightChecks,
  preflightHasBlockers,
  parseGoLiveBody,
  parseSwitchFeedBody,
} from "@/lib/owner/preflight";
import {
  validateCountdownConfigInput,
  type EventCountdownConfig,
} from "@/lib/live/countdown-config";
import {
  loadActiveCountdownConfig,
  saveCountdownConfig,
} from "@/lib/live/fetch-countdown-config";
import { mapEventPhaseState } from "@/lib/owner/map-event-phase";
import { buildRtmpIngestUrlFromEncoderConfig } from "@/lib/owner/resolve-show-encoder-config";
import { resolveIvsChannelConfig } from "@/lib/owner/resolve-ivs-config";
import { loadShowSetupState, type ShowSetupState } from "@/lib/owner/show-setup-state";
import { armMonetizationReminderScheduleOnGoLive } from "@/lib/owner/graphics-monetization-reminders";
import {
  clearActiveLiveKitEgressSessions,
  mergeLivLiveKitBroadcastPreset,
  readLivLiveKitBroadcastState,
} from "@/lib/enterprise/liv-golf/livekit-server";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";

export { parseGoLiveBody, parseSwitchFeedBody };

const GO_LIVE_DEFAULT_WINDOW_MS = 2 * 60 * 60 * 1000;

/** Open or extend the countdown window when an expired schedule would leave eventPhase stuck on ended. */
async function ensureCountdownWindowOpenForGoLive(
  countdownConfig: EventCountdownConfig,
): Promise<EventCountdownConfig> {
  const nowMs = Date.now();
  const endMs = countdownConfig.end_time ? new Date(countdownConfig.end_time).getTime() : Number.NaN;
  const scheduleExpired =
    !countdownConfig.is_active ||
    !countdownConfig.end_time?.trim() ||
    Number.isNaN(endMs) ||
    endMs <= nowMs;

  if (!scheduleExpired) {
    return countdownConfig;
  }

  const startIso = new Date(nowMs).toISOString();
  const endIso = new Date(nowMs + GO_LIVE_DEFAULT_WINDOW_MS).toISOString();
  const candidate: EventCountdownConfig = {
    ...countdownConfig,
    is_active: true,
    start_time: startIso,
    end_time: endIso,
  };

  const validation = validateCountdownConfigInput(candidate);
  if (!validation.ok) {
    console.warn("[owner/go-live] countdown window refresh skipped:", validation.error);
    return countdownConfig;
  }

  try {
    return await saveCountdownConfig(validation.config as EventCountdownConfig);
  } catch (error) {
    console.warn("[owner/go-live] countdown window refresh failed:", error);
    return countdownConfig;
  }
}

export async function runOwnerPreflight(
  mode?: PublishMode,
): Promise<{ snapshot: OwnerBroadcastSnapshot; blocked: boolean }> {
  const admin = (await import("@/lib/supabase/server")).getSupabaseAdmin();
  const { row } = await loadOwnerStreamState(admin);

  if (row && row.publish_status !== "publishing") {
    await updateOwnerStreamState(admin, {
      publish_status: "preflight",
      publish_error_message: null,
      updated_by: "owner_preflight",
    });
  }

  const { snapshot } = await buildOwnerBroadcastSnapshot(mode ?? "external_hls");
  return { snapshot, blocked: preflightHasBlockers(snapshot.preflight) };
}

export async function runOwnerGoLive(
  admin: SupabaseClient,
  body: GoLiveRequestBody,
  updatedBy: string,
): Promise<{ ok: boolean; snapshot: OwnerBroadcastSnapshot; message: string }> {
  const { row } = await loadOwnerStreamState(admin);
  if (row?.is_live) {
    const { snapshot } = await buildOwnerBroadcastSnapshot("external_hls");
    return { ok: false, snapshot, message: "Broadcast is already live." };
  }

  let countdownConfig = await loadActiveCountdownConfig();
  countdownConfig = await ensureCountdownWindowOpenForGoLive(countdownConfig);
  const eventPhase = mapEventPhaseState(countdownConfig);
  const showSetup = await loadShowSetupState();
  const feedOptions = { showSetupHlsUrl: showSetup.attendeePlaybackHlsUrl };
  const feedInputs = {
    primary_playback_url: row?.primary_playback_url,
    playback_url: row?.playback_url,
  };
  const seeded = seedFeedUrlsFromEnv();
  const hlsUrl = resolvePrimaryFeedUrl(feedInputs, feedOptions) ?? seeded.primary_playback_url;
  const hlsProbe = await probeHlsManifest(hlsUrl);
  const ivs = resolveIvsChannelConfig();

  console.info("[owner/go-live] playback selection", {
    selectedShowId: row?.id ?? LIVE_STREAM_STATE_ID,
    ivsChannelArn: ivs.channelArn,
    ivsPlaybackUrl: ivs.playbackUrl,
    streamStatus: row?.is_live ? "live" : "offline",
    playbackUrl: hlsUrl,
    playerMountStatus: hlsProbe.manifestReachable ? "ready" : "waiting",
    probeDetail: hlsProbe.detail,
  });

  const preflight = buildPreflightChecks({
    eventPhase,
    countdownConfig,
    streamState: row,
    hlsProbe,
    requestedMode: "external_hls",
  });

  if (isFatalHlsProbeFailure(hlsProbe)) {
    const { snapshot } = await buildOwnerBroadcastSnapshot("external_hls");
    return {
      ok: false,
      snapshot: { ...snapshot, preflight },
      message: hlsProbe.detail ?? "Active IVS playback URL is invalid.",
    };
  }

  if (preflightHasBlockers(preflight) && !body.confirm) {
    const { snapshot } = await buildOwnerBroadcastSnapshot("external_hls");
    return {
      ok: false,
      snapshot: { ...snapshot, preflight },
      message: "Preflight checks failed. Fix blockers or send confirm: true to override warnings only.",
    };
  }

  const fails = preflight.filter((c) => c.status === "fail");
  if (fails.length > 0 && !body.masterOverride) {
    const { snapshot } = await buildOwnerBroadcastSnapshot("external_hls");
    return {
      ok: false,
      snapshot: { ...snapshot, preflight },
      message: fails.map((f) => f.detail ?? f.label).join(" "),
    };
  }

  await updateOwnerStreamState(admin, {
    publish_mode: "external_hls",
    publish_status: "starting",
    publish_error_message: null,
    playback_status: "ready",
    playback_error_message: null,
    updated_by: updatedBy,
  });

  const showSetupRtmp = buildRtmpIngestUrlFromEncoderConfig({
    rtmpServer: showSetup.primaryIngestEndpoint,
    streamKey: showSetup.streamKey,
    hlsPlaybackUrl: showSetup.attendeePlaybackHlsUrl || null,
  });
  const primaryRtmpIngestUrl =
    showSetupRtmp || row?.primary_rtmp_ingest_url?.trim() || resolvePrimaryRtmpIngestUrl();

  const liveUpdate = await updateOwnerStreamState(admin, {
    publish_status: "publishing",
    playback_status: "playback_pending",
    is_live: true,
    attendee_ui_phase: "live",
    active_source: "primary",
    primary_playback_url: hlsUrl,
    playback_url: hlsUrl,
    ...(primaryRtmpIngestUrl ? { primary_rtmp_ingest_url: primaryRtmpIngestUrl } : {}),
    updated_by: updatedBy,
  });

  if (liveUpdate.error || liveUpdate.row?.is_live !== true) {
    const { snapshot } = await buildOwnerBroadcastSnapshot("external_hls");
    return {
      ok: false,
      snapshot,
      message: liveUpdate.error ?? "Unable to mark broadcast live in platform state.",
    };
  }

  await armMonetizationReminderScheduleOnGoLive(admin, updatedBy);

  await emitStreamStateSync();

  const { snapshot } = await buildOwnerBroadcastSnapshot("external_hls");
  return {
    ok: true,
    snapshot,
    message: "Go-live requested. Playback may remain pending until the Restream manifest is ready.",
  };
}

export type MasterGoLiveResult = {
  ok: boolean;
  snapshot: OwnerBroadcastSnapshot;
  message: string;
  showSetup: ShowSetupState;
  previousTargetDateTime: string;
};

export async function runOwnerMasterGoLive(
  admin: SupabaseClient,
  body: GoLiveRequestBody,
  updatedBy: string,
): Promise<MasterGoLiveResult> {
  const current = await loadShowSetupState();

  const { row } = await loadOwnerStreamState(admin);
  if (row?.is_live) {
    await emitStreamStateSync();
    const { snapshot } = await buildOwnerBroadcastSnapshot("external_hls");
    return {
      ok: true,
      snapshot,
      message: "Broadcast already live.",
      showSetup: current,
      previousTargetDateTime: current.targetDateTime,
    };
  }

  const goLiveResult = await runOwnerGoLive(
    admin,
    { ...body, mode: "external_hls", confirm: true, masterOverride: true },
    updatedBy,
  );

  const showSetup = goLiveResult.ok ? await loadShowSetupState() : current;

  return {
    ok: goLiveResult.ok,
    snapshot: goLiveResult.snapshot,
    message: goLiveResult.message,
    showSetup,
    previousTargetDateTime: current.targetDateTime,
  };
}

export async function runOwnerEndBroadcast(
  admin: SupabaseClient,
  updatedBy: string,
): Promise<{ ok: boolean; snapshot: OwnerBroadcastSnapshot; message: string }> {
  const { row } = await loadOwnerStreamState(admin);
  if (!row?.is_live) {
    const { snapshot } = await buildOwnerBroadcastSnapshot();
    return { ok: false, snapshot, message: "Broadcast is not live." };
  }

  const livekitState = readLivLiveKitBroadcastState(row.audio_master_presets);
  const isLiveKitBroadcast =
    row.publish_mode === "livekit_hls" ||
    Boolean(livekitState?.egressId) ||
    Boolean(row.publisher_session_id);

  let remainingActiveEgressIds: string[] = [];

  if (isLiveKitBroadcast) {
    try {
      const cleared = await clearActiveLiveKitEgressSessions({
        roomName: livekitState?.roomName ?? row.publisher_channel ?? undefined,
        knownEgressIds: [
          livekitState?.egressId,
          row.publisher_session_id,
        ].filter((id): id is string => typeof id === "string" && id.trim() !== ""),
        waitForSlots: false,
      });
      remainingActiveEgressIds = cleared.remainingActiveIds;
    } catch (error) {
      console.warn("[runOwnerEndBroadcast] LiveKit egress stop failed:", error);
    }
  }

  const presets = isLiveKitBroadcast
    ? mergeLivLiveKitBroadcastPreset(row.audio_master_presets, {
        egressId: null,
        endedAt: new Date().toISOString(),
      })
    : row.audio_master_presets;

  await updateOwnerStreamState(admin, {
    publish_status: "ending",
    updated_by: updatedBy,
  });

  const offlinePlayback = preserveOfflinePlaybackFields(row);

  const offlineUpdate = await updateOwnerStreamState(admin, {
    is_live: false,
    attendee_ui_phase: "ended",
    active_source: "offline",
    publish_status: "offline",
    publish_mode: "none",
    playback_status: "ready",
    playback_error_message: null,
    publish_error_message:
      remainingActiveEgressIds.length > 0
        ? `LiveKit is still releasing egress slot(s): ${remainingActiveEgressIds.join(", ")}. Wait ~30s before Open to Fans.`
        : null,
    ...offlinePlayback,
    publisher_session_id: null,
    publisher_channel: null,
    audio_master_presets: presets,
    updated_by: updatedBy,
  });

  if (offlineUpdate.error || offlineUpdate.row?.is_live === true) {
    const { snapshot } = await buildOwnerBroadcastSnapshot();
    return {
      ok: false,
      snapshot,
      message: offlineUpdate.error ?? "Unable to mark broadcast offline.",
    };
  }

  await emitStreamStateSync();

  const { snapshot } = await buildOwnerBroadcastSnapshot();
  const message =
    remainingActiveEgressIds.length > 0
      ? `Broadcast ended. LiveKit is still releasing ${remainingActiveEgressIds.length} egress slot(s) — wait ~30s before Open to Fans.`
      : "Broadcast ended.";

  return { ok: true, snapshot, message };
}

/** Restream-only — feed switching removed (mixer failover can return later). */
export async function runOwnerSwitchFeed(
  _admin: SupabaseClient,
  _body: SwitchFeedRequestBody,
  _updatedBy: string,
): Promise<{ ok: boolean; snapshot: OwnerBroadcastSnapshot; message: string }> {
  const { snapshot } = await buildOwnerBroadcastSnapshot();
  return {
    ok: false,
    snapshot,
    message: "Feed switching is disabled. Restream is the sole playback lane.",
  };
}
