import { getSupabaseAdmin } from "@/lib/supabase/server";
import LiveExperienceClient from "@/components/experience/live/LiveExperienceClient";
import ExperienceHoldingRoomPageClient from "@/components/experience/holding-room/ExperienceHoldingRoomPageClient";
import { buildAttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import { resolveLiveManifestPlayback } from "@/lib/live/resolve-manifest-playback";
import { isAmazonIvsPlaybackUrl } from "@/lib/live/ivs-playback-url";
import { resolveIvsChannelPlaybackUrl } from "@/lib/live/resolve-ivs-channel-playback";
import { redirect } from "next/navigation";
import { buildAttendeeGateUrl } from "@/lib/auth/routing";
import { EXPERIENCE_LIVE_PATH } from "@/lib/experience/live-routes";

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
  // 1. Initialize administrative backend core
  const admin = getSupabaseAdmin();

  // 2. Resolve active authentication user context
  const { data: authData } = await admin.auth.getUser();
  const user = authData?.user;

  // AUTH GATE: If no active user session exists, redirect straight to login gates
  if (!user) {
    redirect(buildAttendeeGateUrl(EXPERIENCE_LIVE_PATH));
  }

  // 3. Fetch user profile snapshot by passing the required User object
  const profile = await buildAttendeeProfileSnapshot(user);

  // 4. Query live stream platform metrics concurrently
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

  // 5. HARD GATE: If the stream or database flag is offline, hold user on the countdown layout clock
  if (!dbIsLive || isUpstreamOffline) {
    return <ExperienceHoldingRoomPageClient initialProfile={profile} />;
  }

  // 6. Deliver the interactive live stream stage frame
  return <LiveExperienceClient initialProfile={profile} />;
}