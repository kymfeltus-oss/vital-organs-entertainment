import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type ExperienceHubStatus = {
  isLive: boolean;
  headline: string;
  statusLabel: string;
  eyebrow: string;
};

export async function loadExperienceHubStatus(): Promise<ExperienceHubStatus> {
  const config = await loadActiveCountdownConfig();
  let isLive = false;

  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("live_stream_state")
      .select("is_live")
      .eq("id", LIVE_STREAM_STATE_ID)
      .maybeSingle();

    isLive = data?.is_live === true;
  } catch {
    isLive = false;
  }

  return {
    isLive,
    headline: config.headline,
    statusLabel: config.status_label,
    eyebrow: config.eyebrow,
  };
}
