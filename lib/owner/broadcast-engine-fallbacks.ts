/** Server-only Restream RTMP ingest fallbacks — never import from client components. */

import { buildPrimaryRtmpIngestUrl } from "@/lib/stream-keys";

export const RESTREAM_RTMP_SERVER_DEFAULT = "rtmp://live.restream.io/live";

/**
 * Builds primary RTMP push URL from server env when cockpit/DB values are unset.
 * Returns null when RESTREAM_STREAM_KEY is missing (no hardcoded secrets).
 */
export function resolvePrimaryRtmpIngestUrl(): string | null {
  const key = process.env.RESTREAM_STREAM_KEY?.trim();
  const server = process.env.RESTREAM_RTMP_SERVER?.trim() || RESTREAM_RTMP_SERVER_DEFAULT;
  if (!key) return null;
  return buildPrimaryRtmpIngestUrl(key, server);
}
