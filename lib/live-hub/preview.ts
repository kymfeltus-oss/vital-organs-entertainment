import {
  isValidHlsUrl,
  resolvePlaybackUrlStatus,
  type PlaybackUrlStatus,
} from "@/lib/live/hls";

export type OpsPreviewStreamState = "live" | "offline" | "standby";

export type OpsLivePreviewPayload = {
  isLive: boolean;
  streamState: OpsPreviewStreamState;
  activeSource: string;
  playbackUrl: string | null;
  primaryPlaybackUrlStatus: PlaybackUrlStatus;
  backupPlaybackUrlStatus: PlaybackUrlStatus;
  canPreview: boolean;
  previewMessage: string | null;
  error?: string;
};

export type OpsPreviewStreamRow = {
  is_live?: boolean | null;
  active_source?: string | null;
  primary_playback_url?: string | null;
  backup_playback_url?: string | null;
};

function normalizeSource(value: string | null | undefined): string {
  const trimmed = value?.trim().toLowerCase() ?? "";
  if (trimmed === "primary" || trimmed === "backup") return trimmed;
  return "offline";
}

/** Resolve which validated HLS URL ops preview may use for the active lane. */
export function resolveOpsPreviewPlaybackUrl(input: {
  activeSource: string | null | undefined;
  primaryPlaybackUrl: string | null | undefined;
  backupPlaybackUrl: string | null | undefined;
}): string | null {
  const activeSource = normalizeSource(input.activeSource);
  const primary = isValidHlsUrl(input.primaryPlaybackUrl)
    ? input.primaryPlaybackUrl.trim()
    : null;
  const backup = isValidHlsUrl(input.backupPlaybackUrl)
    ? input.backupPlaybackUrl.trim()
    : null;

  if (activeSource === "primary") return primary;
  if (activeSource === "backup") return backup;
  return null;
}

export function deriveOpsPreviewStreamState(
  isLive: boolean,
  playbackUrl: string | null,
): OpsPreviewStreamState {
  if (isLive && playbackUrl) return "live";
  if (isLive && !playbackUrl) return "standby";
  if (!isLive && playbackUrl) return "standby";
  return "offline";
}

export function buildOpsLivePreviewPayload(
  row: OpsPreviewStreamRow | null,
  error?: string,
): OpsLivePreviewPayload {
  const isLive = row?.is_live === true;
  const activeSource = normalizeSource(row?.active_source);
  const primaryPlaybackUrlStatus = resolvePlaybackUrlStatus(
    row?.primary_playback_url,
  );
  const backupPlaybackUrlStatus = resolvePlaybackUrlStatus(
    row?.backup_playback_url,
  );
  const playbackUrl = resolveOpsPreviewPlaybackUrl({
    activeSource: row?.active_source,
    primaryPlaybackUrl: row?.primary_playback_url,
    backupPlaybackUrl: row?.backup_playback_url,
  });
  const streamState = deriveOpsPreviewStreamState(isLive, playbackUrl);

  let canPreview = false;
  let previewMessage: string | null = null;

  if (!playbackUrl) {
    previewMessage = "No valid HLS preview source configured.";
  } else if (!isLive) {
    previewMessage =
      "Stream is currently offline. Preview will activate when a valid source is live.";
  } else {
    canPreview = true;
    previewMessage = null;
  }

  return {
    isLive,
    streamState,
    activeSource,
    playbackUrl: canPreview ? playbackUrl : null,
    primaryPlaybackUrlStatus,
    backupPlaybackUrlStatus,
    canPreview,
    previewMessage,
    error,
  };
}
