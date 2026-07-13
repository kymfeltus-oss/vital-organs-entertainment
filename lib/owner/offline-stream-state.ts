import { resolvePrimaryFeedUrl, seedFeedUrlsFromEnv } from "@/lib/owner/feed-urls";
import type { OwnerStreamStateRow } from "@/lib/owner/load-owner-state";

/** Matches migration seed — satisfies live_stream_state.playback_url NOT NULL + not-blank check. */
export const STANDBY_PLAYBACK_URL = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

type PlaybackRow = Pick<OwnerStreamStateRow, "playback_url" | "primary_playback_url"> | null | undefined;

/** Resolve a non-empty playback URL when settling broadcast to offline (column is NOT NULL). */
export function resolveStandbyPlaybackUrl(
  row?: PlaybackRow,
  showSetupHlsUrl?: string | null,
): string {
  const candidates = [
    row?.primary_playback_url,
    row?.playback_url,
    showSetupHlsUrl,
    resolvePrimaryFeedUrl({}),
    seedFeedUrlsFromEnv().primary_playback_url,
    STANDBY_PLAYBACK_URL,
  ];

  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) return trimmed;
  }

  return STANDBY_PLAYBACK_URL;
}

/** Playback fields to include when marking live_stream_state offline without violating NOT NULL. */
export function preserveOfflinePlaybackFields(
  row?: PlaybackRow,
  showSetupHlsUrl?: string | null,
): { playback_url: string; primary_playback_url: string } {
  const playback_url = resolveStandbyPlaybackUrl(row, showSetupHlsUrl);
  const primary_playback_url = row?.primary_playback_url?.trim() || playback_url;
  return { playback_url, primary_playback_url };
}
