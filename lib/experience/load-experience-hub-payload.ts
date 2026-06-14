import type { User } from "@supabase/supabase-js";
import { getUserFromSession } from "@/lib/auth/session";
import { loadExperienceHubContent } from "@/lib/experience/fetch-hub-content";
import {
  computeHubEventPhase,
  resolveExperienceHubSkyline,
  type ExperienceHubPayload,
} from "@/lib/experience/hub-content";
import {
  firstNameFromEmail,
  initialsFromIdentity,
} from "@/lib/experience/user-profile-display";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

async function loadStreamIsLive(): Promise<boolean> {
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("live_stream_state")
      .select("is_live")
      .eq("id", LIVE_STREAM_STATE_ID)
      .maybeSingle();

    return data?.is_live === true;
  } catch {
    return false;
  }
}

function buildUserFromSession(user: User | null): ExperienceHubPayload["user"] {
  const email = user?.email?.trim().toLowerCase() ?? null;
  const metadata = user?.user_metadata as { full_name?: string; name?: string } | undefined;
  const displayName = metadata?.full_name ?? metadata?.name ?? null;
  const firstNameFromDisplay = displayName?.trim().split(/\s+/).filter(Boolean)[0] ?? null;

  return {
    email,
    firstName: firstNameFromDisplay
      ? firstNameFromDisplay.charAt(0).toUpperCase() + firstNameFromDisplay.slice(1)
      : firstNameFromEmail(email),
    initials: initialsFromIdentity(email, displayName),
  };
}

export async function loadExperienceHubPayload(): Promise<ExperienceHubPayload> {
  const [user, countdown, content, isStreamLive] = await Promise.all([
    getUserFromSession(),
    loadActiveCountdownConfig(),
    loadExperienceHubContent(),
    loadStreamIsLive(),
  ]);

  const eventPhase = computeHubEventPhase(countdown);
  const skyline = resolveExperienceHubSkyline(
    content.settings,
    countdown,
    isStreamLive,
    eventPhase,
  );

  return {
    user: buildUserFromSession(user),
    welcome: {
      prefix: content.settings.welcome_prefix,
      joinMessage: content.settings.welcome_join_message,
    },
    brand: {
      eyebrow: content.settings.brand_eyebrow,
      logoUrl: content.settings.brand_logo_url,
      orbitHint: content.settings.orbit_hint,
    },
    skyline,
    featured: content.featured,
    portalTabs: content.portalTabs,
    orbs: content.orbs,
    ambientTracks: content.ambientTracks,
    backdrop: {
      videoUrl: content.settings.backdrop_video_url,
      fallbackImageUrl: content.settings.backdrop_fallback_url,
    },
    heroBackgroundUrl: countdown.hero_background_url,
    menuHref: content.settings.menu_href,
    eventPhase,
    isStreamLive,
    liveSkylineHeadline: content.settings.skyline_headline_live,
    liveSkylineSubhead: content.settings.skyline_subhead_live,
    countdown,
  };
}

/** @deprecated Use loadExperienceHubPayload instead. */
export async function loadExperienceHubStatus() {
  const payload = await loadExperienceHubPayload();
  return {
    isLive: payload.isStreamLive,
    headline: payload.skyline.headline,
    statusLabel: payload.skyline.subhead,
    eyebrow: payload.brand.eyebrow,
  };
}

export type { ExperienceHubPayload } from "@/lib/experience/hub-content";
