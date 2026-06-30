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
import { resolveIvsChannelPlaybackUrl } from "@/lib/live/resolve-ivs-channel-playback";
import { isAmazonIvsPlaybackUrl } from "@/lib/live/ivs-playback-url";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type ResolvedManifestPlayback = {
  playbackUrl: string | null;
  activeSource: "primary" | "backup";
  fromDatabase: boolean;
  isLive: boolean;
  resolutionSource: "database_live" | "env" | "database_primary" | "none";
};

async function resolveEnvPlaybackWithIvsGuard(
  rawUrl: string | null,
): Promise<string | null> {
  if (!rawUrl) return null;
  if (!isAmazonIvsPlaybackUrl(rawUrl)) return rawUrl;

  const ivsPlayback = await resolveIvsChannelPlaybackUrl();

  // #region agent log
  fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
    body: JSON.stringify({
      sessionId: "675ed0",
      runId: "ivs-relay-offline",
      hypothesisId: "H1",
      location: "resolve-manifest-playback.ts:resolveEnvPlaybackWithIvsGuard",
      message: "IVS env guard evaluation",
      data: {
        streamState: ivsPlayback.streamState,
        source: ivsPlayback.source,
        hasAwsPlaybackUrl: Boolean(ivsPlayback.playbackUrl),
        envHost: rawUrl.split("/")[2] ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (ivsPlayback.streamState === "offline") {
    return null;
  }

  if (ivsPlayback.playbackUrl) {
    return ivsPlayback.playbackUrl;
  }

  if (ivsPlayback.source === "unconfigured") {
    return rawUrl;
  }

  return null;
}

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
    if (config.active_source === "backup") {
      const ivsPlayback = await resolveIvsChannelPlaybackUrl();
      if (ivsPlayback.playbackUrl) {
        return {
          playbackUrl: ivsPlayback.playbackUrl,
          activeSource: "backup",
          fromDatabase: false,
          isLive: true,
          resolutionSource: "database_live",
        };
      }

      return {
        playbackUrl: null,
        activeSource: "backup",
        fromDatabase: false,
        isLive: false,
        resolutionSource: "none",
      };
    }

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

  const ivsPlayback = await resolveIvsChannelPlaybackUrl();
  if (ivsPlayback.playbackUrl && config?.active_source === "backup") {
    return {
      playbackUrl: ivsPlayback.playbackUrl,
      activeSource: "backup",
      fromDatabase: false,
      isLive,
      resolutionSource: "database_primary",
    };
  }

  if (config?.active_source === "backup" && ivsPlayback.streamState === "offline") {
    return {
      playbackUrl: null,
      activeSource: "backup",
      fromDatabase: false,
      isLive: false,
      resolutionSource: "none",
    };
  }

  const envPrimary = await resolveEnvPlaybackWithIvsGuard(
    resolvePrimaryAttendeePlaybackFromEnv() ?? resolveAttendeePlaybackFromEnv(),
  );
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
