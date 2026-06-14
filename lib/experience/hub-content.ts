import {
  computeEventCountdownPhase,
  DEFAULT_EVENT_ID,
  type EventCountdownConfig,
  type EventCountdownPhase,
} from "@/lib/live/countdown-config";
import { HUB_DASHBOARD_BG, HUB_SPEC_ASSETS } from "@/lib/experience/hub-design-tokens";
import { HUB_LOGO, isHubOverlayAssetUrl, sanitizeHubDecorativeImageUrl } from "@/lib/experience/hub-assets";

export type ExperienceHubWelcome = {
  prefix: string;
  joinMessage: string;
};

export type ExperienceHubUser = {
  firstName: string;
  initials: string;
  email: string | null;
};

export type ExperienceHubBrand = {
  eyebrow: string;
  logoUrl: string;
  orbitHint: string;
};

export type ExperienceHubSkyline = {
  showLivePill: boolean;
  livePillLabel: string;
  headline: string;
  subhead: string;
};

export type ExperienceHubFeatured = {
  categoryLabel: string;
  title: string;
  body: string;
  durationLabel: string;
  posterUrl: string;
  videoUrl: string;
  ctaLabel: string;
  ctaHref: string;
};

export type ExperienceHubPortalTab = ExperienceHubFeatured & {
  id: string;
  tabKey: string;
};

export type ExperienceHubBackdrop = {
  videoUrl: string;
  fallbackImageUrl: string;
};

export type ExperienceHubOrb = {
  id: string;
  label: string;
  subtext: string;
  href: string;
  iconKey: string;
  accent: "blue" | "pink" | "purple" | "cyan";
  mediaUrl: string | null;
};

export type ExperienceHubAmbientTrack = {
  id: string;
  title: string;
  audioUrl: string;
};

export type ExperienceHubSettingsRow = {
  event_id: string;
  welcome_prefix: string;
  welcome_join_message: string;
  brand_eyebrow: string;
  brand_logo_url: string;
  orbit_hint: string;
  live_pill_label: string;
  skyline_headline_live: string;
  skyline_subhead_live: string;
  menu_href: string;
  backdrop_video_url: string;
  backdrop_fallback_url: string;
};

export type ExperienceHubPortalTabRow = {
  id: string;
  event_id: string;
  tab_key: string;
  category_label: string;
  title: string;
  body: string;
  duration_label: string;
  poster_url: string;
  video_url: string;
  cta_label: string;
  cta_href: string;
  sort_order: number;
  is_active: boolean;
};

export type ExperienceHubFeaturedRow = {
  id: string;
  event_id: string;
  category_label: string;
  title: string;
  body: string;
  duration_label: string;
  poster_url: string;
  video_url: string;
  cta_label: string;
  cta_href: string;
  is_active: boolean;
};

export type ExperienceHubOrbRow = {
  id: string;
  event_id: string;
  slug: string;
  label: string;
  subtext: string;
  href: string;
  icon_key: string;
  accent: string;
  media_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export type ExperienceHubAmbientRow = {
  id: string;
  event_id: string;
  title: string;
  audio_url: string;
  sort_order: number;
  is_active: boolean;
};

export type ExperienceHubPayload = {
  user: ExperienceHubUser;
  welcome: ExperienceHubWelcome;
  brand: ExperienceHubBrand;
  skyline: ExperienceHubSkyline;
  featured: ExperienceHubFeatured;
  portalTabs: ExperienceHubPortalTab[];
  orbs: ExperienceHubOrb[];
  ambientTracks: ExperienceHubAmbientTrack[];
  backdrop: ExperienceHubBackdrop;
  heroBackgroundUrl: string;
  menuHref: string;
  eventPhase: EventCountdownPhase;
  isStreamLive: boolean;
  liveSkylineHeadline: string;
  liveSkylineSubhead: string;
  countdown: EventCountdownConfig;
};

export const DEFAULT_HUB_SETTINGS: ExperienceHubSettingsRow = {
  event_id: DEFAULT_EVENT_ID,
  welcome_prefix: "WELCOME",
  welcome_join_message: "WE'RE SO GLAD YOU JOINED US TODAY.",
  brand_eyebrow: "IAN CRAIG AND",
  brand_logo_url: HUB_LOGO,
  orbit_hint: "TAP AN ORB TO EXPLORE",
  live_pill_label: "((•)) LIVE NOW",
  skyline_headline_live: "THE SANCTUARY STAGE IS OPEN",
  skyline_subhead_live: "JOIN THOUSANDS IN WORSHIP, UNITY AND IMPACT.",
  menu_href: "/updates",
  backdrop_video_url: HUB_DASHBOARD_BG,
  backdrop_fallback_url: HUB_DASHBOARD_BG,
};

export const DEFAULT_HUB_FEATURED: ExperienceHubFeatured = {
  categoryLabel: "MISSION STORY",
  title: "Ian Craig's 30+ Year Dialysis Journey",
  body:
    "Discover how decades of faith, endurance, and worship shaped the 300 Awakening movement — and why every voice in this room matters tonight.",
  durationLabel: "12:45",
  posterUrl: "",
  videoUrl: "/intro-video.mp4",
  ctaLabel: "WATCH FULL STORY",
  ctaHref: "/experience/music",
};

export const DEFAULT_HUB_PORTAL_TABS: ExperienceHubPortalTab[] = [
  {
    id: "mission-story",
    tabKey: "mission-story",
    ...DEFAULT_HUB_FEATURED,
  },
];

export const DEFAULT_HUB_ORBS: ExperienceHubOrb[] = [
  {
    id: "giving",
    label: "Vital Seed Giving",
    subtext: "Every gift has a frequency.",
    href: "/experience/giving",
    iconKey: "giving",
    accent: "blue",
    mediaUrl: null,
  },
  {
    id: "single",
    label: "New Single Out Now",
    subtext: "Support the mission. Download & share.",
    href: "/experience/music",
    iconKey: "single",
    accent: "pink",
    mediaUrl: null,
  },
  {
    id: "connected",
    label: "Stay Connected",
    subtext: "Follow updates, events and mission news.",
    href: "/updates",
    iconKey: "connected",
    accent: "cyan",
    mediaUrl: null,
  },
  {
    id: "encourage",
    label: "Encourage Ian",
    subtext: "Leave a public message of hope and strength.",
    href: "/experience/prayer",
    iconKey: "encourage",
    accent: "pink",
    mediaUrl: null,
  },
];

export const DEFAULT_HUB_AMBIENT: ExperienceHubAmbientTrack[] = [
  {
    id: "ambient-worship",
    title: "Ambient Worship",
    audioUrl: HUB_SPEC_ASSETS.ambientPrimary,
  },
  {
    id: "ambient-fallback",
    title: "Ambient Worship II",
    audioUrl: HUB_SPEC_ASSETS.ambientFallback,
  },
];

const ORB_ACCENTS = new Set<ExperienceHubOrb["accent"]>(["blue", "pink", "purple", "cyan"]);

function sanitizeOrbAccent(value: string): ExperienceHubOrb["accent"] {
  return ORB_ACCENTS.has(value as ExperienceHubOrb["accent"])
    ? (value as ExperienceHubOrb["accent"])
    : "blue";
}

export function mapHubSettingsRow(row: Partial<ExperienceHubSettingsRow>): ExperienceHubSettingsRow {
  return {
    event_id: row.event_id ?? DEFAULT_HUB_SETTINGS.event_id,
    welcome_prefix: row.welcome_prefix?.trim() || DEFAULT_HUB_SETTINGS.welcome_prefix,
    welcome_join_message:
      row.welcome_join_message?.trim() || DEFAULT_HUB_SETTINGS.welcome_join_message,
    brand_eyebrow: row.brand_eyebrow?.trim() || DEFAULT_HUB_SETTINGS.brand_eyebrow,
    brand_logo_url: (() => {
      const url = row.brand_logo_url?.trim();
      if (url && !isHubOverlayAssetUrl(url) && url !== "/images/logoa.png") return url;
      return HUB_LOGO;
    })(),
    orbit_hint: row.orbit_hint?.trim() || DEFAULT_HUB_SETTINGS.orbit_hint,
    live_pill_label: row.live_pill_label?.trim() || DEFAULT_HUB_SETTINGS.live_pill_label,
    skyline_headline_live:
      row.skyline_headline_live?.trim() || DEFAULT_HUB_SETTINGS.skyline_headline_live,
    skyline_subhead_live:
      row.skyline_subhead_live?.trim() || DEFAULT_HUB_SETTINGS.skyline_subhead_live,
    menu_href: row.menu_href?.trim() || DEFAULT_HUB_SETTINGS.menu_href,
    backdrop_video_url:
      row.backdrop_video_url?.trim() || DEFAULT_HUB_SETTINGS.backdrop_video_url,
    backdrop_fallback_url:
      row.backdrop_fallback_url?.trim() || DEFAULT_HUB_SETTINGS.backdrop_fallback_url,
  };
}

export function mapHubFeaturedRow(row: Partial<ExperienceHubFeaturedRow>): ExperienceHubFeatured {
  return {
    categoryLabel: row.category_label?.trim() || DEFAULT_HUB_FEATURED.categoryLabel,
    title: row.title?.trim() || DEFAULT_HUB_FEATURED.title,
    body: row.body?.trim() || DEFAULT_HUB_FEATURED.body,
    durationLabel: row.duration_label?.trim() || DEFAULT_HUB_FEATURED.durationLabel,
    posterUrl: sanitizeHubDecorativeImageUrl(row.poster_url?.trim()) ?? "",
    videoUrl: row.video_url?.trim() || DEFAULT_HUB_FEATURED.videoUrl,
    ctaLabel: row.cta_label?.trim() || DEFAULT_HUB_FEATURED.ctaLabel,
    ctaHref: row.cta_href?.trim() || DEFAULT_HUB_FEATURED.ctaHref,
  };
}

export function mapHubPortalTabRow(row: ExperienceHubPortalTabRow): ExperienceHubPortalTab {
  return {
    id: row.id,
    tabKey: row.tab_key,
    ...mapHubFeaturedRow(row),
  };
}

export function mapHubOrbRow(row: ExperienceHubOrbRow): ExperienceHubOrb {
  return {
    id: row.id,
    label: row.label?.trim() || row.slug,
    subtext: row.subtext?.trim() || "",
    href: row.href?.trim() || "/experience",
    iconKey: row.icon_key?.trim() || row.slug,
    accent: sanitizeOrbAccent(row.accent),
    mediaUrl: sanitizeHubDecorativeImageUrl(row.media_url?.trim()),
  };
}

export function mapHubAmbientRow(row: ExperienceHubAmbientRow): ExperienceHubAmbientTrack {
  return {
    id: row.id,
    title: row.title?.trim() || "Track",
    audioUrl: row.audio_url?.trim() || DEFAULT_HUB_AMBIENT[0].audioUrl,
  };
}

export function resolveExperienceHubSkyline(
  settings: ExperienceHubSettingsRow,
  _countdown: EventCountdownConfig,
  isStreamLive: boolean,
  eventPhase: EventCountdownPhase,
): ExperienceHubSkyline {
  const showLivePill = isStreamLive && eventPhase === "live";

  return {
    showLivePill,
    livePillLabel: settings.live_pill_label,
    headline: settings.skyline_headline_live,
    subhead: settings.skyline_subhead_live,
  };
}

export function computeHubEventPhase(countdown: EventCountdownConfig): EventCountdownPhase {
  return computeEventCountdownPhase(countdown.start_time, countdown.end_time);
}
