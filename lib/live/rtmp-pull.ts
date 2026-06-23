/**
 * RTMP pull URL validation for operator monitoring ingest (Restream pull links).
 * Browsers cannot play RTMP — pair with camera_preview_hls_url for in-app preview.
 */
export function isValidRtmpPullUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "rtmp:" && parsed.protocol !== "rtmps:") return false;
    return parsed.hostname.toLowerCase().includes("pull");
  } catch {
    return false;
  }
}

/** Accept any valid RTMP URL when hostname lacks pull (manual operator paste). */
export function isValidRtmpPullUrlLoose(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "rtmp:" || parsed.protocol === "rtmps:";
  } catch {
    return false;
  }
}

export type RtmpPullUrlStatus = "valid" | "invalid" | "missing";

export function resolveRtmpPullUrlStatus(
  raw: string | null | undefined,
): RtmpPullUrlStatus {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return "missing";
  return isValidRtmpPullUrlLoose(trimmed) ? "valid" : "invalid";
}

export const RTMP_PULL_REQUIREMENT =
  "RTMP pull URL must use rtmp:// or rtmps:// (Restream combined pull link for vMix/OBS monitoring).";

export function formatRtmpPullLaneLabel(
  status: RtmpPullUrlStatus,
  configured: boolean,
): string {
  if (configured) return "Configured";
  if (status === "invalid") return "Invalid (not RTMP)";
  return "Missing";
}

export function buildRestreamPullCombinedUrl(streamKey: string): string {
  const key = streamKey.trim();
  return `rtmp://pull.restream.io/pull/${key}`;
}
