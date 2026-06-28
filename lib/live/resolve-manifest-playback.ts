import { fetchManifestStreamConfig } from "@/lib/live/fetch-manifest-stream-config";
import {
  resolveAttendeePlaybackFromEnv,
  resolvePrimaryAttendeePlaybackFromEnv,
} from "@/lib/live/manifest-dev-fallback";
import { repairStaleLiveStreamPlaybackUrls } from "@/lib/live/repair-stale-playback-urls";
import { invalidateManifestStreamCache } from "@/lib/live/manifest-stream-cache";
import { sanitizeAttendeePlaybackUrl } from "@/lib/live/playback-url-validation";
import {
  resolveActiveFeedPlaybackUrl,
  resolvePrimaryFeedUrl,
} from "@/lib/owner/feed-urls";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type ResolvedManifestPlayback = {
  playbackUrl: string | null;
  activeSource: "primary" | "backup";
  fromDatabase: boolean;
  isLive: boolean;
  resolutionSource: "database_live" | "env" | "database_primary" | "none";
};

/**
 * Resolve attendee HLS manifest for /api/stream/manifest.
 * When live, honors live_stream_state.active_source and dual feed URLs.
 */
export async function resolveLiveManifestPlayback(): Promise<ResolvedManifestPlayback> {
  const admin = getSupabaseAdmin();

  if (await repairStaleLiveStreamPlaybackUrls(admin)) {
    invalidateManifestStreamCache();
  }

  const { config } = await fetchManifestStreamConfig(admin);
  const isLive = Boolean(config?.is_live);

  if (config?.is_live) {
    const { url, activeSource } = resolveActiveFeedPlaybackUrl({
      primary_playback_url: config.primary_playback_url,
      backup_playback_url: config.backup_playback_url,
      playback_url: config.playback_url,
      active_source: config.active_source,
      is_live: true,
    });

    const playbackUrl = sanitizeAttendeePlaybackUrl(url, "live_stream_state.active_feed");
    if (playbackUrl) {
      return {
        playbackUrl,
        activeSource: activeSource === "backup" ? "backup" : "primary",
        fromDatabase: true,
        isLive: true,
        resolutionSource: "database_live",
      };
    }
  }

  const envPrimary =
    resolvePrimaryAttendeePlaybackFromEnv() ?? resolveAttendeePlaybackFromEnv();
  if (envPrimary) {
    return {
      playbackUrl: envPrimary,
      activeSource: "primary",
      fromDatabase: false,
      isLive,
      resolutionSource: "env",
    };
  }

  if (config) {
    const primaryOnly = sanitizeAttendeePlaybackUrl(
      resolvePrimaryFeedUrl({
        primary_playback_url: config.primary_playback_url,
        playback_url: config.playback_url,
      }),
      "live_stream_state.primary_playback_url",
    );
    if (primaryOnly) {
      return {
        playbackUrl: primaryOnly,
        activeSource: "primary",
        fromDatabase: true,
        isLive,
        resolutionSource: "database_primary",
      };
    }
  }

  return {
    playbackUrl: null,
    activeSource: "primary",
    fromDatabase: false,
    isLive,
    resolutionSource: "none",
  };
}
