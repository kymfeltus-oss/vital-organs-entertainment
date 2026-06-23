import type { SupabaseClient } from "@supabase/supabase-js";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";
import {
  DEFAULT_STUDIO_ENGINE_MODE,
  normalizeStudioEngineMode,
  type StudioEngineMode,
} from "@/lib/ops/studio-engine-mode";

export type LiveStreamStateRow = {
  is_live: boolean | null;
  active_source: string | null;
  primary_playback_url: string | null;
  backup_playback_url: string | null;
  primary_rtmp_ingest_url: string | null;
  backup_rtmp_ingest_url: string | null;
  primary_rtmp_pull_url: string | null;
  backup_rtmp_pull_url: string | null;
  camera_preview_hls_url: string | null;
  studio_engine_mode: StudioEngineMode | null;
  updated_at: string | null;
  updated_by: string | null;
};

const SELECT_FULL =
  "is_live, active_source, primary_playback_url, backup_playback_url, primary_rtmp_ingest_url, backup_rtmp_ingest_url, primary_rtmp_pull_url, backup_rtmp_pull_url, camera_preview_hls_url, studio_engine_mode, updated_at, updated_by";

const SELECT_OPS_CORE =
  "is_live, active_source, primary_playback_url, backup_playback_url, studio_engine_mode, updated_at, updated_by";

const SELECT_LEGACY =
  "is_live, active_source, primary_playback_url, backup_playback_url, updated_at, updated_by";

function isMissingColumnError(message: string): boolean {
  return /column .+ does not exist/i.test(message) || message.includes("42703");
}

function normalizeRow(
  row: Record<string, unknown> | null,
  defaults: Partial<LiveStreamStateRow> = {},
): LiveStreamStateRow | null {
  if (!row) return null;

  return {
    is_live: (row.is_live as boolean | null) ?? null,
    active_source: (row.active_source as string | null) ?? null,
    primary_playback_url: (row.primary_playback_url as string | null) ?? null,
    backup_playback_url: (row.backup_playback_url as string | null) ?? null,
    primary_rtmp_ingest_url: defaults.primary_rtmp_ingest_url ?? null,
    backup_rtmp_ingest_url: defaults.backup_rtmp_ingest_url ?? null,
    primary_rtmp_pull_url: defaults.primary_rtmp_pull_url ?? null,
    backup_rtmp_pull_url: defaults.backup_rtmp_pull_url ?? null,
    camera_preview_hls_url: defaults.camera_preview_hls_url ?? null,
    studio_engine_mode:
      row.studio_engine_mode !== undefined
        ? normalizeStudioEngineMode(row.studio_engine_mode)
        : (defaults.studio_engine_mode ?? DEFAULT_STUDIO_ENGINE_MODE),
    updated_at: (row.updated_at as string | null) ?? null,
    updated_by: (row.updated_by as string | null) ?? null,
  };
}

/**
 * Load live_stream_state with fallback when RTMP migration columns are not yet applied.
 */
export async function fetchLiveStreamStateRow(
  admin: SupabaseClient,
): Promise<LiveStreamStateRow | null> {
  const fullResult = await admin
    .from("live_stream_state")
    .select(SELECT_FULL)
    .eq("id", LIVE_STREAM_STATE_ID)
    .maybeSingle();

  if (!fullResult.error) {
    return normalizeRow(fullResult.data as Record<string, unknown> | null);
  }

  if (!isMissingColumnError(fullResult.error.message)) {
    throw new Error(fullResult.error.message);
  }

  const coreResult = await admin
    .from("live_stream_state")
    .select(SELECT_OPS_CORE)
    .eq("id", LIVE_STREAM_STATE_ID)
    .maybeSingle();

  if (!coreResult.error) {
    return normalizeRow(coreResult.data as Record<string, unknown> | null);
  }

  if (!isMissingColumnError(coreResult.error.message)) {
    throw new Error(coreResult.error.message);
  }

  const legacyResult = await admin
    .from("live_stream_state")
    .select(SELECT_LEGACY)
    .eq("id", LIVE_STREAM_STATE_ID)
    .maybeSingle();

  if (legacyResult.error) {
    throw new Error(legacyResult.error.message);
  }

  return normalizeRow(legacyResult.data as Record<string, unknown> | null, {
    studio_engine_mode: DEFAULT_STUDIO_ENGINE_MODE,
  });
}

export function isLiveStreamRtmpSchemaError(message: string): boolean {
  return isMissingColumnError(message);
}
