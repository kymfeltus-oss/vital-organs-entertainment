import crypto from "crypto";
import { isValidRtmpUrl } from "@/lib/live/rtmp";

const DEFAULT_STREAM_KEY_PREFIX = "300awakening_live";
export const DEFAULT_RTMP_INGEST_SERVER_BASE = "rtmp://vitalorgansent.com/live";

/**
 * Generates a cryptographically secure, random alphanumeric stream key string.
 * Example output: 300awakening_live_a7f3b89c2d
 */
export function generateSecureStreamKey(
  prefix: string = DEFAULT_STREAM_KEY_PREFIX,
): string {
  const randomHex = crypto.randomBytes(5).toString("hex");
  return `${prefix}_${randomHex}`;
}

/** RTMP server base for encoder "Server URL" field (no trailing stream key). */
export function resolveRtmpIngestServerBase(): string {
  const fromEnv = process.env.RTMP_INGEST_SERVER_BASE?.trim();
  if (fromEnv) {
    const normalized = fromEnv.replace(/\/+$/, "");
    if (isValidRtmpUrl(normalized)) return normalized;
  }
  return DEFAULT_RTMP_INGEST_SERVER_BASE;
}

/** Full push URL stored in live_stream_state.primary_rtmp_ingest_url. */
export function buildPrimaryRtmpIngestUrl(
  streamKey: string,
  serverBase: string = resolveRtmpIngestServerBase(),
): string {
  const base = serverBase.replace(/\/+$/, "");
  const key = streamKey.trim().replace(/^\/+/, "");
  return `${base}/${key}`;
}

export type RtmpIngestParts = {
  serverUrl: string;
  streamKey: string;
  fullUrl: string;
};

/** Split a stored RTMP ingest URL into encoder server + stream key fields. */
export function splitRtmpIngestUrl(fullUrl: string | null | undefined): RtmpIngestParts | null {
  const trimmed = fullUrl?.trim() ?? "";
  if (!isValidRtmpUrl(trimmed)) return null;

  try {
    const parsed = new URL(trimmed);
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return null;

    const streamKey = segments[segments.length - 1] ?? "";
    if (!streamKey) return null;

    const serverPath = segments.slice(0, -1);
    const serverUrl = `${parsed.protocol}//${parsed.host}${
      serverPath.length > 0 ? `/${serverPath.join("/")}` : ""
    }`;

    return { serverUrl, streamKey, fullUrl: trimmed };
  } catch {
    return null;
  }
}
