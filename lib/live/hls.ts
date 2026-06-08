/**
 * Shared HLS manifest URL validation for manifest shield, ops snapshot, and Live Hub readiness.
 */
export function isValidHlsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    return parsed.pathname.toLowerCase().endsWith(".m3u8");
  } catch {
    return false;
  }
}

export type PlaybackUrlStatus = "valid" | "invalid" | "missing";

export function resolvePlaybackUrlStatus(raw: string | null | undefined): PlaybackUrlStatus {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return "missing";
  return isValidHlsUrl(trimmed) ? "valid" : "invalid";
}

export const HLS_PLAYBACK_REQUIREMENT =
  "Playback URL must be a valid HLS .m3u8 manifest (http/https).";

export function formatPlaybackLaneLabel(
  status: PlaybackUrlStatus,
  configured: boolean,
): string {
  if (configured) return "Configured";
  if (status === "invalid") return "Invalid (not .m3u8)";
  return "Missing";
}
