import { isValidHlsUrl } from "@/lib/live/hls";
import { isValidRtmpUrl } from "@/lib/live/rtmp";
import { isValidRtmpPullUrlLoose } from "@/lib/live/rtmp-pull";

/** DB-stored lane keys on live_stream_state — env fallbacks must NOT affect X/4. */
export type RestreamStoredOutputLanes = {
  pushConfigured: boolean;
  pullConfigured: boolean;
  previewConfigured: boolean;
  playbackConfigured: boolean;
  provisionedCount: number;
  totalLanes: 4;
};

type StoredStreamRow = {
  primary_rtmp_ingest_url?: string | null;
  primary_rtmp_pull_url?: string | null;
  camera_preview_hls_url?: string | null;
  primary_playback_url?: string | null;
} | null;

/**
 * Count Restream output lanes from persisted DB strings only.
 * Maps: push → primary_rtmp_ingest_url, pull → primary_rtmp_pull_url,
 * preview → camera_preview_hls_url, playback → primary_playback_url.
 */
export function buildStoredRestreamOutputLanes(
  row: StoredStreamRow,
): RestreamStoredOutputLanes {
  const pushConfigured = isValidRtmpUrl(row?.primary_rtmp_ingest_url?.trim());
  const pullConfigured = isValidRtmpPullUrlLoose(row?.primary_rtmp_pull_url?.trim());
  const previewConfigured = isValidHlsUrl(row?.camera_preview_hls_url?.trim());
  const playbackConfigured = isValidHlsUrl(row?.primary_playback_url?.trim());

  const lanes = [pushConfigured, pullConfigured, previewConfigured, playbackConfigured];

  return {
    pushConfigured,
    pullConfigured,
    previewConfigured,
    playbackConfigured,
    provisionedCount: lanes.filter(Boolean).length,
    totalLanes: 4,
  };
}
