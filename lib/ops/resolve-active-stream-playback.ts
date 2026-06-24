import { isValidHlsUrl } from "@/lib/live/hls";
import {
  DEV_MANIFEST_FALLBACK_HLS,
  isDevManifestFallbackEnabled,
} from "@/lib/live/manifest-dev-fallback";
import type { OpsSnapshot } from "@/lib/ops/types";

type StreamPlaybackFields = Pick<
  OpsSnapshot["stream"],
  | "activeSource"
  | "primaryPlaybackUrl"
  | "backupPlaybackUrl"
  | "cameraPreviewHlsUrl"
>;

/**
 * Resolve the HLS URL ops preview / camera tiles should bind based on active_source.
 * Primary lane → local/native playback; backup lane → Restream cloud preview.
 */
export function resolveActiveOpsPreviewHlsUrl(
  stream: StreamPlaybackFields | null | undefined,
): string | null {
  if (!stream) return null;

  const primary = stream.primaryPlaybackUrl?.trim() ?? "";
  const backup = stream.backupPlaybackUrl?.trim() ?? "";
  const preview = stream.cameraPreviewHlsUrl?.trim() ?? "";

  if (stream.activeSource === "backup") {
    if (isValidHlsUrl(preview)) return preview;
    if (isValidHlsUrl(backup)) return backup;
    return null;
  }

  if (stream.activeSource === "primary") {
    if (isValidHlsUrl(primary)) return primary;
    if (isValidHlsUrl(preview)) return preview;
    return null;
  }

  if (isValidHlsUrl(preview)) return preview;
  if (isValidHlsUrl(primary)) return primary;
  return null;
}

/**
 * Broadcast desk camera preview — uses dev Mux fallback when no valid HLS is stored,
 * matching RestreamConfigModal "Test Connection" desk-test behavior.
 */
export function resolveBroadcastDeskPreviewHlsUrl(
  stream: StreamPlaybackFields | null | undefined,
): string | null {
  const resolved = resolveActiveOpsPreviewHlsUrl(stream);
  if (resolved) return resolved;

  if (isDevManifestFallbackEnabled()) {
    return DEV_MANIFEST_FALLBACK_HLS;
  }

  return null;
}
