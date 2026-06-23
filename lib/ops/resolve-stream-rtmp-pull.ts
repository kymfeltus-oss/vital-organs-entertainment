import { isValidHlsUrl, resolvePlaybackUrlStatus } from "@/lib/live/hls";
import {
  isValidRtmpPullUrlLoose,
  resolveRtmpPullUrlStatus,
} from "@/lib/live/rtmp-pull";

function envPullUrl(name: "PRIMARY_RTMP_PULL_URL" | "BACKUP_RTMP_PULL_URL"): string | null {
  const value = process.env[name]?.trim();
  return isValidRtmpPullUrlLoose(value) ? value : null;
}

function envCameraPreviewHls(): string | null {
  const value = process.env.CAMERA_PREVIEW_HLS_URL?.trim();
  return isValidHlsUrl(value) ? value : null;
}

export function resolveStoredRtmpPullUrl(
  stored: string | null | undefined,
  envFallback: "PRIMARY_RTMP_PULL_URL" | "BACKUP_RTMP_PULL_URL",
): string | null {
  const trimmed = stored?.trim() ?? "";
  if (isValidRtmpPullUrlLoose(trimmed)) return trimmed;
  return envPullUrl(envFallback);
}

export function resolveCameraPreviewHlsUrl(
  stored: string | null | undefined,
  primaryPlaybackUrl: string | null | undefined,
): string | null {
  const trimmed = stored?.trim() ?? "";
  if (isValidHlsUrl(trimmed)) return trimmed;

  const playback = primaryPlaybackUrl?.trim() ?? "";
  if (isValidHlsUrl(playback)) return playback;

  return envCameraPreviewHls();
}

export function buildRtmpPullFields(
  primaryStored: string | null | undefined,
  backupStored: string | null | undefined,
  cameraPreviewStored: string | null | undefined,
  primaryPlaybackUrl: string | null | undefined,
) {
  const primaryRtmpPullUrl = resolveStoredRtmpPullUrl(primaryStored, "PRIMARY_RTMP_PULL_URL");
  const backupRtmpPullUrl = resolveStoredRtmpPullUrl(backupStored, "BACKUP_RTMP_PULL_URL");
  const cameraPreviewHlsUrl = resolveCameraPreviewHlsUrl(
    cameraPreviewStored,
    primaryPlaybackUrl,
  );

  const primaryRtmpPullUrlStatus = resolveRtmpPullUrlStatus(primaryRtmpPullUrl);
  const backupRtmpPullUrlStatus = resolveRtmpPullUrlStatus(backupRtmpPullUrl);
  const cameraPreviewHlsUrlStatus = resolvePlaybackUrlStatus(cameraPreviewHlsUrl);

  return {
    primaryRtmpPullUrl,
    backupRtmpPullUrl,
    cameraPreviewHlsUrl,
    primaryRtmpPullUrlStatus,
    backupRtmpPullUrlStatus,
    cameraPreviewHlsUrlStatus,
    primaryRtmpPullConfigured: primaryRtmpPullUrlStatus === "valid",
    backupRtmpPullConfigured: backupRtmpPullUrlStatus === "valid",
    cameraPreviewConfigured: cameraPreviewHlsUrlStatus === "valid",
  };
}
