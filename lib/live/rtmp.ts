/**
 * RTMP ingest URL validation for operator camera / OBS push endpoints.
 * Browsers cannot play RTMP — these URLs are for copy-into-encoder workflows only.
 */
export function isValidRtmpUrl(value: unknown): value is string {
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

export type RtmpIngestUrlStatus = "valid" | "invalid" | "missing";

export function resolveRtmpIngestUrlStatus(
  raw: string | null | undefined,
): RtmpIngestUrlStatus {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return "missing";
  return isValidRtmpUrl(trimmed) ? "valid" : "invalid";
}

export const RTMP_INGEST_REQUIREMENT =
  "RTMP ingest URL must use rtmp:// or rtmps:// (for OBS, vMix, or mobile encoder push).";

export function formatRtmpIngestLaneLabel(
  status: RtmpIngestUrlStatus,
  configured: boolean,
): string {
  if (configured) return "Configured";
  if (status === "invalid") return "Invalid (not RTMP)";
  return "Missing";
}

/** Mask trailing stream key segment for safe logs — keeps host + app path visible. */
export function maskRtmpIngestUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return `${parsed.protocol}//${parsed.host}/***`;

    const maskedPath =
      segments.length === 1
        ? "/***"
        : `/${segments.slice(0, -1).join("/")}/***`;

    return `${parsed.protocol}//${parsed.host}${maskedPath}`;
  } catch {
    return "***";
  }
}
