import { isValidHlsUrl } from "@/lib/live/hls";
import {
  isStaleIvsChannelPlaybackUrl,
  ivsPlaybackUrlMatchesArn,
  parseIvsChannelArn,
  parseIvsHostIdFromPlaybackUrl,
  parseIvsPlaybackUrl,
} from "@/lib/live/ivs-playback-url";

/** Hostnames commonly used as placeholders — not operator Restream/CDN endpoints. */
const KNOWN_DEMO_PLAYBACK_HOSTS = [
  "test-streams.mux.dev",
  "mux.dev",
  "unified-streaming.com",
  "demo.unified-streaming.com",
  "bitdash-a.akamaihd.net",
] as const;

export type PlaybackUrlValidationResult =
  | { ok: true; url: string; warnings: string[] }
  | { ok: false; url: string | null; reason: string; warnings: string[] };

function parseHostname(url: string): string | null {
  try {
    return new URL(url.trim()).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isKnownDemoHost(hostname: string): boolean {
  return KNOWN_DEMO_PLAYBACK_HOSTS.some(
    (demo) => hostname === demo || hostname.endsWith(`.${demo}`),
  );
}

/**
 * Validates attendee HLS playback URLs for manifest/env resolution.
 * Requires a .m3u8 manifest path; rejects known public demo CDNs.
 */
export function validateAttendeePlaybackUrl(
  raw: string | null | undefined,
  source: string,
): PlaybackUrlValidationResult {
  const url = raw?.trim() ?? "";
  const warnings: string[] = [];

  if (!url) {
    return { ok: false, url: null, reason: "empty_url", warnings };
  }

  if (!isValidHlsUrl(url)) {
    return {
      ok: false,
      url,
      reason: "missing_m3u8_extension",
      warnings: [
        `${source}: URL must be an HLS manifest ending in .m3u8 (got ${url}). Set ATTENDEE_PLAYBACK_HLS_URL to your Restream/CDN .m3u8 URL.`,
      ],
    };
  }

  const hostname = parseHostname(url);
  if (!hostname) {
    return { ok: false, url, reason: "invalid_url", warnings: [`${source}: malformed playback URL.`] };
  }

  if (isKnownDemoHost(hostname)) {
    return {
      ok: false,
      url,
      reason: "known_demo_host",
      warnings: [
        `${source}: ${hostname} is a public demo/test CDN — not your OBS/Restream output. Update ATTENDEE_PLAYBACK_HLS_URL to your Restream .m3u8 and restart the dev server.`,
      ],
    };
  }

  if (hostname.includes("restream.io") && !url.includes(".m3u8")) {
    warnings.push(
      `${source}: restream.io marketing/dashboard URLs are not HLS manifests — use the .m3u8 from Restream while live.`,
    );
  }

  if (isStaleIvsChannelPlaybackUrl(url)) {
    const staleId = parseIvsPlaybackUrl(url)?.channelId ?? "unknown";
    return {
      ok: false,
      url,
      reason: "stale_ivs_channel",
      warnings: [
        `${source}: IVS channel ${staleId} is retired. Update Supabase live_stream_state or set ATTENDEE_BACKUP_HLS_URL to channel jj20qLRLUTLp, then restart the dev server.`,
      ],
    };
  }

  const ivsArn = process.env.AWS_IVS_CHANNEL_ARN?.trim();
  if (ivsArn && hostname.includes("playback.live-video.net")) {
    const arnRef = parseIvsChannelArn(ivsArn);
    const urlRef = parseIvsPlaybackUrl(url);
    const configuredHostId = process.env.AWS_IVS_HOST_ID?.trim();
    const urlHostId = parseIvsHostIdFromPlaybackUrl(url);

    if (!urlRef) {
      warnings.push(
        `${source}: IVS playback URL path must be /api/video/v1/{region}.{accountId}.channel.{channelId}.m3u8`,
      );
    } else if (arnRef && !ivsPlaybackUrlMatchesArn(url, ivsArn)) {
      return {
        ok: false,
        url,
        reason: "ivs_channel_mismatch",
        warnings: [
          `${source}: IVS channel ID in URL (${urlRef.channelId}) does not match AWS_IVS_CHANNEL_ARN (${arnRef.channelId}). Copy the playback URL from the IVS console for channel ${arnRef.channelId}.`,
        ],
      };
    } else if (configuredHostId && urlHostId && urlHostId !== configuredHostId) {
      return {
        ok: false,
        url,
        reason: "ivs_host_mismatch",
        warnings: [
          `${source}: IVS host ID in URL (${urlHostId}) does not match AWS_IVS_HOST_ID (${configuredHostId}). Copy the playback URL from the IVS console.`,
        ],
      };
    }
  }

  return { ok: true, url, warnings };
}

const loggedValidationWarnings = new Set<string>();

/** Log validation warnings once per process to avoid manifest-request spam. */
export function logPlaybackValidationWarnings(
  result: PlaybackUrlValidationResult,
  context: string,
): void {
  for (const warning of result.warnings) {
    const key = `${context}:${warning}`;
    if (loggedValidationWarnings.has(key)) continue;
    loggedValidationWarnings.add(key);
    console.warn(`[stream/manifest] ${warning}`);
  }

  if (result.ok === false && result.url) {
    const rejectKey = `${context}:reject:${result.reason}:${result.url}`;
    if (!loggedValidationWarnings.has(rejectKey)) {
      loggedValidationWarnings.add(rejectKey);
      console.error(
        `[stream/manifest] Rejected playback URL from ${context} (${result.reason}): ${result.url}`,
      );
    }
  }
}

export function sanitizeAttendeePlaybackUrl(
  raw: string | null | undefined,
  source: string,
): string | null {
  const result = validateAttendeePlaybackUrl(raw, source);
  logPlaybackValidationWarnings(result, source);
  return result.ok ? result.url : null;
}
