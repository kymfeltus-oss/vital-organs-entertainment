import { isValidHlsUrl } from "@/lib/live/hls";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";
import { broadcastOpsStreamStateSync } from "@/lib/ops/broadcast-stream-state-sync";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type PrimaryStreamStats = {
  isPublishing: boolean;
  bitrate: number;
};

export type FailoverPollResult =
  | { action: "skipped"; reason: string }
  | { action: "healthy"; bitrate: number; isPublishing: boolean }
  | {
      action: "failover";
      previousSource: string;
      backupPlaybackUrl: string | null;
      trigger: "crash" | "inactive";
    };

const DEFAULT_STATS_TIMEOUT_MS = 2_000;
const DEFAULT_PRIMARY_STREAM_STATS_URL =
  "http://localhost:8000/api/streams/live/camera-guy";

export function resolvePrimaryStreamStatsUrl(): string {
  const fromEnv = process.env.PRIMARY_STREAM_STATS_URL?.trim();
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  return DEFAULT_PRIMARY_STREAM_STATS_URL;
}

function resolvePrimaryStreamStatsUrlOrNull(): string | null {
  const fromEnv = process.env.PRIMARY_STREAM_STATS_URL?.trim();
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  if (process.env.NODE_ENV === "development") return DEFAULT_PRIMARY_STREAM_STATS_URL;
  return null;
}

function parsePrimaryStreamStats(payload: unknown): PrimaryStreamStats {
  if (!payload || typeof payload !== "object") {
    return { isPublishing: false, bitrate: 0 };
  }

  const record = payload as Record<string, unknown>;
  const nestedStream =
    record.stream && typeof record.stream === "object"
      ? (record.stream as Record<string, unknown>)
      : null;

  const bitrateCandidate =
    typeof record.bitrate === "number"
      ? record.bitrate
      : typeof record.bw_in === "number"
        ? record.bw_in
        : typeof nestedStream?.bitrate === "number"
          ? nestedStream.bitrate
          : 0;

  const publishingFlag =
    record.isPublishing === true ||
    record.publishing === true ||
    nestedStream?.isPublishing === true ||
    nestedStream?.publishing === true;

  const isPublishing =
    publishingFlag || (bitrateCandidate > 0 && record.isPublishing !== false);

  return {
    isPublishing,
    bitrate: Math.max(0, Math.round(bitrateCandidate)),
  };
}

export async function fetchPrimaryStreamStats(
  statsUrl: string,
  timeoutMs = DEFAULT_STATS_TIMEOUT_MS,
): Promise<PrimaryStreamStats> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(statsUrl, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return { isPublishing: false, bitrate: 0 };
    }

    const payload = (await response.json()) as unknown;
    return parsePrimaryStreamStats(payload);
  } finally {
    clearTimeout(timeout);
  }
}

export async function executeEmergencyCloudFailover(): Promise<{
  switched: boolean;
  backupPlaybackUrl: string | null;
}> {
  const admin = getSupabaseAdmin();

  const { data: row, error: loadError } = await admin
    .from("live_stream_state")
    .select(
      "id, is_live, active_source, backup_playback_url, camera_preview_hls_url, updated_by",
    )
    .eq("id", LIVE_STREAM_STATE_ID)
    .maybeSingle();

  if (loadError || !row) {
    throw loadError ?? new Error("Stream state row not found.");
  }

  if (row.is_live !== true) {
    return { switched: false, backupPlaybackUrl: null };
  }

  if (row.active_source === "backup") {
    return {
      switched: false,
      backupPlaybackUrl: row.backup_playback_url ?? row.camera_preview_hls_url ?? null,
    };
  }

  const backupFromRow = row.backup_playback_url?.trim() ?? "";
  const previewFromRow = row.camera_preview_hls_url?.trim() ?? "";
  const resolvedBackup = isValidHlsUrl(backupFromRow)
    ? backupFromRow
    : isValidHlsUrl(previewFromRow)
      ? previewFromRow
      : null;

  const patch: Record<string, string> = {
    active_source: "backup",
    updated_at: new Date().toISOString(),
    updated_by: "failover_monitor",
  };

  if (!isValidHlsUrl(backupFromRow) && resolvedBackup) {
    patch.backup_playback_url = resolvedBackup;
  }

  const { error: updateError } = await admin
    .from("live_stream_state")
    .update(patch)
    .eq("id", LIVE_STREAM_STATE_ID);

  if (updateError) throw updateError;

  try {
    await broadcastOpsStreamStateSync();
  } catch (syncError) {
    console.warn("[FAILOVER_MONITOR_SYNC_WARN]:", syncError);
  }

  console.warn(
    "[FAILOVER_MONITOR] Primary stream failure detected — active_source switched to backup.",
  );

  return { switched: true, backupPlaybackUrl: resolvedBackup };
}

export async function checkPrimaryStreamHealth(
  statsUrl?: string | null,
): Promise<FailoverPollResult> {
  const admin = getSupabaseAdmin();

  const { data: row, error } = await admin
    .from("live_stream_state")
    .select("is_live, active_source")
    .eq("id", LIVE_STREAM_STATE_ID)
    .maybeSingle();

  if (error) throw error;

  if (row?.is_live !== true) {
    return { action: "skipped", reason: "stream_offline" };
  }

  if (row.active_source !== "primary") {
    return { action: "skipped", reason: "not_on_primary_lane" };
  }

  const resolvedStatsUrl = statsUrl ?? resolvePrimaryStreamStatsUrlOrNull();
  if (!resolvedStatsUrl) {
    return { action: "skipped", reason: "stats_url_unconfigured" };
  }

  let stats: PrimaryStreamStats;
  try {
    stats = await fetchPrimaryStreamStats(resolvedStatsUrl);
  } catch (fetchError) {
    console.warn("[FAILOVER_MONITOR] Primary stats unreachable:", fetchError);
    const failover = await executeEmergencyCloudFailover();
    return {
      action: "failover",
      previousSource: "primary",
      backupPlaybackUrl: failover.backupPlaybackUrl,
      trigger: "crash",
    };
  }

  if (!stats.isPublishing || stats.bitrate === 0) {
    const failover = await executeEmergencyCloudFailover();
    return {
      action: "failover",
      previousSource: "primary",
      backupPlaybackUrl: failover.backupPlaybackUrl,
      trigger: "inactive",
    };
  }

  return {
    action: "healthy",
    bitrate: stats.bitrate,
    isPublishing: stats.isPublishing,
  };
}
