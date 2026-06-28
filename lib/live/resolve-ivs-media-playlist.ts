import { collapseIvsMasterForDevRelay } from "@/lib/live/relay-playlist-normalize";

const CACHE_TTL_MS = 600_000;

type CachedMediaUrl = {
  mediaUrl: string;
  expiresAt: number;
};

const mediaUrlCache = new Map<string, CachedMediaUrl>();

function extractMediaPlaylistUrl(collapsedMaster: string): string | null {
  for (const line of collapsedMaster.split("\n")) {
    const trimmed = line.trim();
    if (/^https?:\/\//i.test(trimmed) && /\.m3u8(\?|$)/i.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
}

/**
 * Resolve IVS master → single 480p media playlist so the player never opens
 * multiple ABR lanes (use22/use23) through the dev relay.
 */
export async function resolveIvsSingleVariantMediaUrl(masterUrl: string): Promise<string> {
  const cached = mediaUrlCache.get(masterUrl);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.mediaUrl;
  }

  try {
    const response = await fetch(masterUrl, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "*/*" },
    });

    if (!response.ok) {
      return masterUrl;
    }

    const collapsed = collapseIvsMasterForDevRelay(await response.text());
    const mediaUrl = extractMediaPlaylistUrl(collapsed);
    if (!mediaUrl) {
      return masterUrl;
    }

    mediaUrlCache.set(masterUrl, {
      mediaUrl,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return mediaUrl;
  } catch {
    return masterUrl;
  }
}
