import {
  DEFAULT_HUB_AMBIENT,
  DEFAULT_HUB_FEATURED,
  DEFAULT_HUB_ORBS,
  DEFAULT_HUB_PORTAL_TABS,
  DEFAULT_HUB_SETTINGS,
  mapHubAmbientRow,
  mapHubFeaturedRow,
  mapHubOrbRow,
  mapHubPortalTabRow,
  mapHubSettingsRow,
  type ExperienceHubAmbientRow,
  type ExperienceHubAmbientTrack,
  type ExperienceHubFeaturedRow,
  type ExperienceHubOrb,
  type ExperienceHubOrbRow,
  type ExperienceHubPortalTab,
  type ExperienceHubPortalTabRow,
  type ExperienceHubSettingsRow,
} from "@/lib/experience/hub-content";
import { DEFAULT_EVENT_ID } from "@/lib/live/countdown-config";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type ExperienceHubContentBundle = {
  settings: ExperienceHubSettingsRow;
  featured: ReturnType<typeof mapHubFeaturedRow>;
  portalTabs: ExperienceHubPortalTab[];
  orbs: ExperienceHubOrb[];
  ambientTracks: ExperienceHubAmbientTrack[];
};

export async function loadExperienceHubContent(): Promise<ExperienceHubContentBundle> {
  try {
    const supabase = getSupabaseAdmin();

    const [settingsResult, featuredResult, portalTabsResult, orbsResult, ambientResult] =
      await Promise.all([
        supabase
          .from("experience_hub_settings")
          .select("*")
          .eq("event_id", DEFAULT_EVENT_ID)
          .maybeSingle(),
        supabase
          .from("experience_hub_featured")
          .select("*")
          .eq("event_id", DEFAULT_EVENT_ID)
          .eq("is_active", true)
          .maybeSingle(),
        supabase
          .from("experience_hub_portal_tabs")
          .select("*")
          .eq("event_id", DEFAULT_EVENT_ID)
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("experience_hub_orbs")
          .select("*")
          .eq("event_id", DEFAULT_EVENT_ID)
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("experience_hub_ambient_tracks")
          .select("*")
          .eq("event_id", DEFAULT_EVENT_ID)
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);

    const settings = mapHubSettingsRow(
      (settingsResult.data as Partial<ExperienceHubSettingsRow> | null) ?? DEFAULT_HUB_SETTINGS,
    );

    const featured = mapHubFeaturedRow(
      (featuredResult.data as Partial<ExperienceHubFeaturedRow> | null) ?? {
        category_label: DEFAULT_HUB_FEATURED.categoryLabel,
        title: DEFAULT_HUB_FEATURED.title,
        body: DEFAULT_HUB_FEATURED.body,
        duration_label: DEFAULT_HUB_FEATURED.durationLabel,
        poster_url: DEFAULT_HUB_FEATURED.posterUrl,
        video_url: DEFAULT_HUB_FEATURED.videoUrl,
        cta_label: DEFAULT_HUB_FEATURED.ctaLabel,
        cta_href: DEFAULT_HUB_FEATURED.ctaHref,
      },
    );

    const portalTabRows = (portalTabsResult.data as ExperienceHubPortalTabRow[] | null) ?? [];
    const portalTabs =
      portalTabRows.length > 0
        ? portalTabRows.map(mapHubPortalTabRow)
        : DEFAULT_HUB_PORTAL_TABS;

    const orbRows = (orbsResult.data as ExperienceHubOrbRow[] | null) ?? [];
    const orbs = orbRows.length > 0 ? orbRows.map(mapHubOrbRow) : DEFAULT_HUB_ORBS;

    const ambientRows = (ambientResult.data as ExperienceHubAmbientRow[] | null) ?? [];
    const ambientTracks =
      ambientRows.length > 0 ? ambientRows.map(mapHubAmbientRow) : DEFAULT_HUB_AMBIENT;

    return { settings, featured, portalTabs, orbs, ambientTracks };
  } catch {
    return {
      settings: DEFAULT_HUB_SETTINGS,
      featured: DEFAULT_HUB_FEATURED,
      portalTabs: DEFAULT_HUB_PORTAL_TABS,
      orbs: DEFAULT_HUB_ORBS,
      ambientTracks: DEFAULT_HUB_AMBIENT,
    };
  }
}
