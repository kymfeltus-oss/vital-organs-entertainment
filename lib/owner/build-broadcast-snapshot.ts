import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type {
  FeedLaneState,
  FeedState,
  OwnerBroadcastSnapshot,
  PlaybackState,
  PublishState,
} from "@/lib/owner/contracts";
import { probeHlsManifest } from "@/lib/owner/hls-readiness";
import { resolvePrimaryFeedUrl } from "@/lib/owner/feed-urls";
import { loadOwnerStreamState } from "@/lib/owner/load-owner-state";
import { readEncoderConfigFromStreamPresets } from "@/lib/owner/resolve-show-encoder-config";
import { mapEventPhaseState } from "@/lib/owner/map-event-phase";
import { buildPreflightChecks } from "@/lib/owner/preflight";

const EMPTY_BACKUP_LANE: FeedLaneState = {
  hlsUrl: null,
  manifestReachable: false,
  detail: "Restream-only — backup lane disabled.",
};

function resolvePublishState(row: Awaited<ReturnType<typeof loadOwnerStreamState>>["row"]): PublishState {
  if (!row) {
    return { mode: "none", status: "offline", errorMessage: null };
  }

  let status = row.publish_status ?? "offline";
  if (row.is_live && status !== "publishing" && status !== "ending" && status !== "starting") {
    status = "publishing";
  }

  return {
    mode: row.is_live ? row.publish_mode ?? "external_hls" : row.publish_mode ?? "none",
    status,
    errorMessage: row.publish_error_message,
  };
}

function resolvePlaybackState(
  row: Awaited<ReturnType<typeof loadOwnerStreamState>>["row"],
  hlsUrl: string | null,
  manifestReachable: boolean,
): PlaybackState {
  if (!row) {
    return {
      status: hlsUrl ? "ready" : "unconfigured",
      hlsUrl,
      manifestReachable,
      errorMessage: null,
    };
  }

  let status = row.playback_status ?? "unconfigured";
  if (status === "playback_pending" && manifestReachable && row.is_live) {
    status = "live";
  } else if (status === "unconfigured" && hlsUrl) {
    status = "ready";
  }

  return {
    status,
    hlsUrl,
    manifestReachable,
    errorMessage: row.playback_error_message,
  };
}

async function buildFeedState(
  row: Awaited<ReturnType<typeof loadOwnerStreamState>>["row"],
  showSetupHlsUrl: string | null,
  manifestProbeTimeoutMs?: number,
): Promise<FeedState> {
  const inputs = {
    primary_playback_url: row?.primary_playback_url,
    playback_url: row?.playback_url,
    is_live: row?.is_live,
  };

  const primaryUrl = resolvePrimaryFeedUrl(inputs, { showSetupHlsUrl });
  const primaryProbe = await probeHlsManifest(primaryUrl, {
    timeoutMs: manifestProbeTimeoutMs,
  });

  return {
    activeSource: row?.is_live ? "primary" : "offline",
    primary: {
      hlsUrl: primaryProbe.hlsUrl ?? primaryUrl,
      manifestReachable: primaryProbe.manifestReachable,
      detail: primaryProbe.detail,
    },
    backup: EMPTY_BACKUP_LANE,
  };
}

export type BuildOwnerBroadcastSnapshotOptions = {
  manifestProbeTimeoutMs?: number;
};

export async function buildOwnerBroadcastSnapshot(
  _requestedMode?: PublishState["mode"],
  options: BuildOwnerBroadcastSnapshotOptions = {},
): Promise<{ snapshot: OwnerBroadcastSnapshot; error: string | null }> {
  const admin = getSupabaseAdmin();

  const [countdownConfig, streamResult] = await Promise.all([
    loadActiveCountdownConfig(),
    loadOwnerStreamState(admin),
  ]);

  const eventPhase = mapEventPhaseState(countdownConfig);
  const row = streamResult.row;
  const encoderConfig = readEncoderConfigFromStreamPresets(row?.audio_master_presets);
  const showSetupHlsUrl = encoderConfig.hlsPlaybackUrl;
  const feed = await buildFeedState(row, showSetupHlsUrl, options.manifestProbeTimeoutMs);

  const hlsUrl = feed.primary.hlsUrl;
  const manifestReachable = feed.primary.manifestReachable;

  const hlsProbe = {
    envConfigured: Boolean(hlsUrl),
    hlsUrl,
    manifestReachable,
    detail: feed.primary.detail,
    invalidReason: feed.primary.manifestReachable ? null : "manifest_unreachable" as const,
  };

  const preflight = buildPreflightChecks({
    eventPhase,
    countdownConfig,
    streamState: row,
    hlsProbe,
    requestedMode: "external_hls",
    feed,
  });

  const snapshot: OwnerBroadcastSnapshot = {
    capturedAt: new Date().toISOString(),
    eventPhase,
    publish: resolvePublishState(row),
    playback: resolvePlaybackState(row, hlsUrl, manifestReachable),
    feed,
    preflight,
    publisherSessionId: row?.publisher_session_id ?? null,
    publisherChannel: row?.publisher_channel ?? null,
    vmix: null,
  };

  return {
    snapshot,
    error: streamResult.error,
  };
}

/** @deprecated Restream-only — kept for legacy imports. */
export function buildVmixTelemetryBypass() {
  return null;
}
