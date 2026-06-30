import { getSupabaseAdmin } from "@/lib/supabase/server";
import LiveExperienceClient from "@/components/experience/live/LiveExperienceClient";
import ExperienceHoldingRoomPageClient from "@/components/experience/holding-room/ExperienceHoldingRoomPageClient";
import { buildAttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import { resolveLiveManifestPlayback } from "@/lib/live/resolve-manifest-playback";
import { isAmazonIvsPlaybackUrl } from "@/lib/live/ivs-playback-url";
import { resolveIvsChannelPlaybackUrl } from "@/lib/live/resolve-ivs-channel-playback";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function checkIsUpstreamOffline(playbackUrl: string | null): Promise<boolean> {
  if (!playbackUrl || !isAmazonIvsPlaybackUrl(playbackUrl)) return false;
  try {
    const check = await resolveIvsChannelPlaybackUrl();
    return !check.playbackUrl;
  } catch {
    return true;
  }
}

export default async function LiveExperiencePage() {
  // 1. Initialize the server-side administrative client interface
  const admin = getSupabaseAdmin();

  // 2. Fetch the user profile snapshot by passing the required database client context
  const profile = await buildAttendeeProfileSnapshot(admin);

  // 3. Query the live broadcast manifest state concurrently
  const [streamStateResult, resolvedPlayback] = await Promise.all([
    admin
      .from("live_stream_state")
      .select("is_live, current_state")
      .eq("id", "current_event")
      .maybeSingle(),
    resolveLiveManifestPlayback(),
  ]);

  const dbIsLive = streamStateResult.data?.is_live === true && streamStateResult.data?.current_state === "live";
  const isUpstreamOffline = await checkIsUpstreamOffline(resolvedPlayback.playbackUrl);

  // 4. HARD GATE: If the database says offline, OR if the actual video feed is offline,
  // hold the attendee securely on the countdown clock page.
  if (!dbIsLive || isUpstreamOffline) {
    return <ExperienceHoldingRoomPageClient initialProfile={profile} />;
  }

  // 5. Only mount the live stream media canvas if the broadcast signal is actively transmitting
  return <LiveExperienceClient initialProfile={profile} />;
}