import { isValidHlsUrl } from "@/lib/live/hls";
import { resolveAttendeePlaybackFromEnv } from "@/lib/live/manifest-dev-fallback";

export type HlsProbeResult = {
  envConfigured: boolean;
  hlsUrl: string | null;
  manifestReachable: boolean;
  detail: string | null;
};

const MANIFEST_PROBE_TIMEOUT_MS = 4_000;

/**
 * Short-lived probe cache + in-flight dedupe.
 *
 * The cockpit polls several endpoints every few seconds (broadcast snapshot,
 * encoder-health, stream-health, manifest) and each independently probes the
 * same external HLS URL. Without caching, one cockpit render fires N redundant
 * cross-network fetches that serialize into 15-20s of latency on cold start.
 * A brief TTL collapses them into a single shared probe per URL.
 */
const PROBE_CACHE_TTL_MS = 10_000;

type CachedProbe = { result: HlsProbeResult; expiresAt: number };

const probeCache = new Map<string, CachedProbe>();
const probeInFlight = new Map<string, Promise<HlsProbeResult>>();

export function resolveSafePublicHlsUrl(
  dbPlaybackUrl: string | null | undefined,
): string | null {
  const envUrl = resolveAttendeePlaybackFromEnv();
  const dbUrl = dbPlaybackUrl?.trim() ?? "";

  if (envUrl && isValidHlsUrl(envUrl)) return envUrl;
  if (dbUrl && isValidHlsUrl(dbUrl)) return dbUrl;
  if (envUrl) return envUrl;
  if (dbUrl) return dbUrl;
  return null;
}

export async function probeHlsManifest(url: string | null): Promise<HlsProbeResult> {
  const envConfigured = Boolean(resolveAttendeePlaybackFromEnv()?.trim());
  const hlsUrl = url;

  if (!hlsUrl) {
    return {
      envConfigured,
      hlsUrl: null,
      manifestReachable: false,
      detail: "No public HLS manifest configured.",
    };
  }

  if (!isValidHlsUrl(hlsUrl)) {
    return {
      envConfigured,
      hlsUrl,
      manifestReachable: false,
      detail: "Playback URL is not a valid .m3u8 manifest.",
    };
  }

  const now = Date.now();
  const cached = probeCache.get(hlsUrl);
  if (cached && cached.expiresAt > now) {
    return { ...cached.result, envConfigured };
  }

  const existing = probeInFlight.get(hlsUrl);
  if (existing) {
    const result = await existing;
    return { ...result, envConfigured };
  }

  const pending = fetchHlsProbe(hlsUrl, envConfigured);
  probeInFlight.set(hlsUrl, pending);

  try {
    const result = await pending;
    probeCache.set(hlsUrl, { result, expiresAt: Date.now() + PROBE_CACHE_TTL_MS });
    return result;
  } finally {
    probeInFlight.delete(hlsUrl);
  }
}

async function fetchHlsProbe(hlsUrl: string, envConfigured: boolean): Promise<HlsProbeResult> {
  try {
    const response = await fetch(hlsUrl, {
      method: "GET",
      headers: { Accept: "application/vnd.apple.mpegurl, application/x-mpegURL, */*" },
      signal: AbortSignal.timeout(MANIFEST_PROBE_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        envConfigured,
        hlsUrl,
        manifestReachable: false,
        detail: `Manifest request failed (${response.status}).`,
      };
    }

    const body = await response.text();
    const looksLikeManifest = body.includes("#EXTM3U");
    return {
      envConfigured,
      hlsUrl,
      manifestReachable: looksLikeManifest,
      detail: looksLikeManifest ? null : "Response was not an HLS manifest.",
    };
  } catch (error) {
    return {
      envConfigured,
      hlsUrl,
      manifestReachable: false,
      detail: error instanceof Error ? error.message : "Manifest probe failed.",
    };
  }
}
