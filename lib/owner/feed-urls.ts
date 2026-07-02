import type { ManifestStreamSource } from "@/lib/live/fetch-manifest-stream-config";
import { resolveRestreamHlsUrl, type RestreamPlaybackInputs } from "@/lib/owner/restream-playback";

export type FeedUrlInputs = {
  primary_playback_url?: string | null;
  backup_playback_url?: string | null;
  playback_url?: string | null;
  active_source?: string | null;
  is_live?: boolean;
};

export type PrimaryFeedOptions = {
  showSetupHlsUrl?: string | null;
};

function toRestreamInputs(
  inputs: FeedUrlInputs,
  options?: PrimaryFeedOptions,
): RestreamPlaybackInputs {
  return {
    primary_playback_url: inputs.primary_playback_url,
    playback_url: inputs.playback_url,
    showSetupHlsUrl: options?.showSetupHlsUrl,
  };
}

/** Restream HLS — sole attendee playback lane. */
export function resolvePrimaryFeedUrl(
  inputs: FeedUrlInputs = {},
  options?: PrimaryFeedOptions,
): string | null {
  return resolveRestreamHlsUrl(toRestreamInputs(inputs, options));
}

/** Restream-only stack — backup lane removed. */
export function resolveBackupFeedUrl(_inputs: FeedUrlInputs = {}): string | null {
  return null;
}

export function normalizeActiveFeedSource(
  _raw: string | null | undefined,
  isLive: boolean,
): ManifestStreamSource {
  return isLive ? "primary" : "offline";
}

export function resolveActiveFeedPlaybackUrl(
  inputs: FeedUrlInputs,
  options?: PrimaryFeedOptions,
): {
  url: string | null;
  activeSource: ManifestStreamSource;
} {
  const url = resolvePrimaryFeedUrl(inputs, options);
  if (!inputs.is_live) {
    return { url, activeSource: "offline" };
  }
  return { url, activeSource: url ? "primary" : "offline" };
}

export function seedFeedUrlsFromEnv(): {
  primary_playback_url: string | null;
  backup_playback_url: string | null;
} {
  return {
    primary_playback_url: resolvePrimaryFeedUrl({}),
    backup_playback_url: null,
  };
}
