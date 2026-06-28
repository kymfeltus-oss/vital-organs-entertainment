import type { ManifestStreamSource } from "@/lib/live/fetch-manifest-stream-config";
import {
  normalizeEnvPlaybackString,
  rejectDemoPlaybackUrl,
  resolvePrimaryAttendeePlaybackFromEnv,
} from "@/lib/live/manifest-dev-fallback";
import { sanitizeAttendeePlaybackUrl } from "@/lib/live/playback-url-validation";

export type FeedUrlInputs = {
  primary_playback_url?: string | null;
  backup_playback_url?: string | null;
  playback_url?: string | null;
  active_source?: string | null;
  is_live?: boolean;
};

/** Server-only backup HLS manifest (Amazon IVS, etc.). */
export function resolveBackupPlaybackFromEnv(): string | null {
  return sanitizeAttendeePlaybackUrl(
    normalizeEnvPlaybackString(process.env.ATTENDEE_BACKUP_HLS_URL),
    "ATTENDEE_BACKUP_HLS_URL",
  );
}

export function resolvePrimaryFeedUrl(inputs: FeedUrlInputs = {}): string | null {
  const env = resolvePrimaryAttendeePlaybackFromEnv();
  if (env) return env;

  const dbPrimary = sanitizeAttendeePlaybackUrl(
    rejectDemoPlaybackUrl(inputs.primary_playback_url),
    "live_stream_state.primary_playback_url",
  );
  if (dbPrimary) return dbPrimary;

  const legacy = sanitizeAttendeePlaybackUrl(
    rejectDemoPlaybackUrl(inputs.playback_url),
    "live_stream_state.playback_url",
  );
  if (legacy) return legacy;

  return null;
}

export function resolveBackupFeedUrl(inputs: FeedUrlInputs = {}): string | null {
  const env = resolveBackupPlaybackFromEnv();
  if (env) return env;

  return sanitizeAttendeePlaybackUrl(
    inputs.backup_playback_url,
    "live_stream_state.backup_playback_url",
  );
}

export function normalizeActiveFeedSource(
  raw: string | null | undefined,
  isLive: boolean,
): ManifestStreamSource {
  if (raw === "primary" || raw === "backup" || raw === "offline") {
    return raw;
  }
  return isLive ? "primary" : "offline";
}

export function resolveActiveFeedPlaybackUrl(inputs: FeedUrlInputs): {
  url: string | null;
  activeSource: ManifestStreamSource;
} {
  const activeSource = normalizeActiveFeedSource(inputs.active_source, inputs.is_live === true);
  const primary = resolvePrimaryFeedUrl(inputs);
  const backup = resolveBackupFeedUrl(inputs);

  if (activeSource === "backup") {
    if (backup) return { url: backup, activeSource: "backup" };
    if (primary) return { url: primary, activeSource: "primary" };
    return { url: null, activeSource: "offline" };
  }

  if (activeSource === "primary") {
    return { url: primary, activeSource: primary ? "primary" : "offline" };
  }

  return { url: null, activeSource: "offline" };
}

export function seedFeedUrlsFromEnv(): {
  primary_playback_url: string | null;
  backup_playback_url: string | null;
} {
  return {
    primary_playback_url: resolvePrimaryFeedUrl({}),
    backup_playback_url: resolveBackupFeedUrl({}),
  };
}
