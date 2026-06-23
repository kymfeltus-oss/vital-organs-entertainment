import { isValidHlsUrl } from "@/lib/live/hls";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const DEV_FALLBACK_HLS = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

/**
 * Local dev helper — repair invalid/missing primary HLS URLs so Live Hub readiness can pass.
 * Production builds never run this path.
 */
export async function ensureDevStreamPlaybackConfigured(): Promise<void> {
  if (process.env.NODE_ENV !== "development") return;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("live_stream_state")
    .select("id, playback_url, primary_playback_url")
    .eq("id", LIVE_STREAM_STATE_ID)
    .maybeSingle();

  if (error || !data) return;

  if (isValidHlsUrl(data.primary_playback_url)) return;

  const candidates = [
    data.primary_playback_url,
    process.env.NEXT_PUBLIC_HLS_STREAM_URL,
    data.playback_url,
    DEV_FALLBACK_HLS,
  ];

  const resolved = candidates.find((value) => isValidHlsUrl(value));
  if (!resolved) return;

  const playbackUrl = isValidHlsUrl(data.playback_url) ? data.playback_url.trim() : resolved.trim();

  await admin
    .from("live_stream_state")
    .update({
      primary_playback_url: resolved.trim(),
      playback_url: playbackUrl,
      updated_at: new Date().toISOString(),
      updated_by: "dev_playback_repair",
    })
    .eq("id", LIVE_STREAM_STATE_ID);
}
