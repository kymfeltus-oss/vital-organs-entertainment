import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchManifestStreamConfig } from "@/lib/live/fetch-manifest-stream-config";
import { invalidateManifestStreamCache } from "@/lib/live/manifest-stream-cache";
import { sanitizeAttendeePlaybackUrl } from "@/lib/live/playback-url-validation";
import { seedFeedUrlsFromEnv } from "@/lib/owner/feed-urls";
import { updateOwnerStreamState } from "@/lib/owner/load-owner-state";

/**
 * When Supabase still holds a retired IVS channel URL, overwrite from env seeds.
 * Called before manifest resolution so attendees never receive stale playback paths.
 */
export async function repairStaleLiveStreamPlaybackUrls(
  admin: SupabaseClient,
): Promise<boolean> {
  const { config } = await fetchManifestStreamConfig(admin);
  if (!config) return false;

  const seeded = seedFeedUrlsFromEnv();
  if (!seeded.primary_playback_url && !seeded.backup_playback_url) return false;

  const patch: Record<string, string> = {};

  const candidates: Array<{
    column: "primary_playback_url" | "backup_playback_url" | "playback_url";
    current: string | null;
    replacement: string | null;
  }> = [
    {
      column: "primary_playback_url",
      current: config.primary_playback_url,
      replacement: seeded.primary_playback_url,
    },
    {
      column: "backup_playback_url",
      current: config.backup_playback_url,
      replacement: seeded.backup_playback_url,
    },
    {
      column: "playback_url",
      current: config.playback_url,
      replacement: seeded.primary_playback_url ?? seeded.backup_playback_url,
    },
  ];

  for (const { column, current, replacement } of candidates) {
    if (!current?.trim() || !replacement) continue;
    const valid = sanitizeAttendeePlaybackUrl(current, `live_stream_state.${column}`);
    if (!valid) {
      patch[column] = replacement;
    }
  }

  if (Object.keys(patch).length === 0) return false;

  console.warn(
    "[stream/manifest] Repairing stale playback URL(s) in Supabase live_stream_state:",
    Object.keys(patch).join(", "),
  );

  const { error } = await updateOwnerStreamState(admin, patch);
  if (error) {
    console.error("[stream/manifest] Failed to repair stale playback URLs:", error);
    return false;
  }

  invalidateManifestStreamCache();
  return true;
}
