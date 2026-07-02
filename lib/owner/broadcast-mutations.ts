import type { SupabaseClient } from "@supabase/supabase-js";
import type { GoLiveRequestBody, OwnerBroadcastSnapshot, PublishMode, SwitchFeedRequestBody } from "@/lib/owner/contracts";
import { buildOwnerBroadcastSnapshot } from "@/lib/owner/build-broadcast-snapshot";
import { emitStreamStateSync } from "@/lib/owner/broadcast-stream-sync";
import { resolvePrimaryRtmpIngestUrl } from "@/lib/owner/broadcast-engine-fallbacks";
import { resolvePrimaryFeedUrl, seedFeedUrlsFromEnv } from "@/lib/owner/feed-urls";
import { probeHlsManifest } from "@/lib/owner/hls-readiness";
import { loadOwnerStreamState, updateOwnerStreamState } from "@/lib/owner/load-owner-state";
import {
  buildPreflightChecks,
  preflightHasBlockers,
  parseGoLiveBody,
  parseSwitchFeedBody,
} from "@/lib/owner/preflight";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";
import { mapEventPhaseState } from "@/lib/owner/map-event-phase";
import { buildRtmpIngestUrlFromEncoderConfig } from "@/lib/owner/resolve-show-encoder-config";
import { loadShowSetupState, type ShowSetupState } from "@/lib/owner/show-setup-state";

export { parseGoLiveBody, parseSwitchFeedBody };

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

  const countdownConfig = await loadActiveCountdownConfig();
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

  const preflight = buildPreflightChecks({
    eventPhase,
    countdownConfig,
    streamState: row,
    hlsProbe,
    requestedMode: "external_hls",
  });

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

  await updateOwnerStreamState(admin, {
    publish_status: "ending",
    updated_by: updatedBy,
  });

  const offlineUpdate = await updateOwnerStreamState(admin, {
    is_live: false,
    attendee_ui_phase: "ended",
    active_source: "offline",
    publish_status: "offline",
    publish_mode: "none",
    playback_status: "ready",
    playback_error_message: null,
    publish_error_message: null,
    publisher_session_id: null,
    publisher_channel: null,
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
  return { ok: true, snapshot, message: "Broadcast ended." };
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
