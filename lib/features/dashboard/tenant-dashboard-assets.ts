/** Experience dashboard — mobile video backdrop + route targets. */

import { EXPERIENCE_LIVE_PATH } from "@/lib/features/live/live-routes";

/** Fixed mobile dashboard artboard — logo lives in the flat background plate. */
export const TENANT_DASHBOARD_ARTBOARD = {
  width: 1080,
  height: 1920,
} as const;

/** Fallback art dimensions until video metadata loads — tune if export size differs. */
export const TENANT_DASHBOARD_CONCERT_BACKDROP_ART = {
  width: TENANT_DASHBOARD_ARTBOARD.width,
  height: TENANT_DASHBOARD_ARTBOARD.height,
} as const;

export const TENANT_DASHBOARD_MOBILE_VIEWPORT = {
  width: 390,
  height: 844,
} as const;

/** 9:16 portrait dashboard plate — fluid on all viewports (no phone-frame clamp). */
export const TENANT_DASHBOARD_CONTAINER = {
  aspectWidth: 9,
  aspectHeight: 16,
} as const;

/** PNG button grid — scaled overlay footprint on mobile artboard. */
export const TENANT_DASHBOARD_BUTTON_GRID_SCALE = 0.85 as const;

/** Overlay layout — native 1080×1920 artboard coordinates (px). */
export const TENANT_DASHBOARD_OVERLAY_LAYOUT = {
  artboardWidth: TENANT_DASHBOARD_ARTBOARD.width,
  artboardHeight: TENANT_DASHBOARD_ARTBOARD.height,
  safeArea: {
    top: 60,
    right: 40,
    bottom: 52,
    left: 40,
  },
  logoClearBottomY: 632,
  logoToStoryMinGap: 32,
  cardScale: TENANT_DASHBOARD_BUTTON_GRID_SCALE,
  storyCardScale: 1,
  contentTrackPadding: 16,
  dashboardCardGap: 8,
  overlayCardGap: 8,
  gridCardGap: 8,
  actionGridMaxWidth: 358,
  storyCardMaxWidth: 358,
  actionCellPadding: 0,
  gridCardPillInset: 12,
  gridTopOffset: 0,
  artboardScrollHeight: 2420,
} as const;

export const TENANT_DASHBOARD_STORY_TOP_Y =
  TENANT_DASHBOARD_OVERLAY_LAYOUT.logoClearBottomY +
  TENANT_DASHBOARD_OVERLAY_LAYOUT.logoToStoryMinGap;

export const TENANT_DASHBOARD_CREATOR_STREAM_SRC: string | null = null;

export const TENANT_DASHBOARD_ASSETS = {
  background: "/tenant-default/dashboard-concert-bg-mobile.mp4",
  logo: "/branding/awakening-lockup.png",
  welcomeHeader: "/tenant-default/dashboard/welcome-header.png",
  ianCraigStoryPoster: "/tenant-default/dashboard/ian-craig-story.png",
  ianCraigStoryVideo: null as string | null,
  routes: {
    enterExperience: EXPERIENCE_LIVE_PATH,
    watchStory: "/story",
    giving: "/giving",
    liveRoom: EXPERIENCE_LIVE_PATH,
    music: "/music",
    prayer: "/prayer",
  },
} as const;

export const TENANT_DASHBOARD_BUTTON_ASSETS = {
  music: "/tenant-default/dashboard/music.png",
  live: "/tenant-default/dashboard/live.png",
  giving: "/tenant-default/dashboard/vital-seed.png",
  prayer: "/tenant-default/dashboard/prayer-contact.png",
} as const;

export const TENANT_DASHBOARD_BUTTON_GRID = [
  {
    id: "music",
    href: TENANT_DASHBOARD_ASSETS.routes.music,
    src: TENANT_DASHBOARD_BUTTON_ASSETS.music,
    ariaLabel: "Music — Listen, download, and share",
  },
  {
    id: "live",
    href: TENANT_DASHBOARD_ASSETS.routes.liveRoom,
    src: TENANT_DASHBOARD_BUTTON_ASSETS.live,
    ariaLabel: "Live Room — Enter the sanctuary stage",
  },
  {
    id: "giving",
    href: TENANT_DASHBOARD_ASSETS.routes.giving,
    src: TENANT_DASHBOARD_BUTTON_ASSETS.giving,
    ariaLabel: "Vital Seed Giving — Every gift has a frequency",
  },
  {
    id: "prayer",
    href: TENANT_DASHBOARD_ASSETS.routes.prayer,
    src: TENANT_DASHBOARD_BUTTON_ASSETS.prayer,
    ariaLabel: "Prayer — Leave a message of hope",
  },
] as const;

export const TENANT_DASHBOARD_CARDS = [
  {
    id: "giving",
    label: "Vital Seed",
    href: TENANT_DASHBOARD_ASSETS.routes.giving,
    ariaLabel: "Vital Seed Giving — Every gift has a frequency",
  },
  {
    id: "live",
    label: "Live Room",
    href: TENANT_DASHBOARD_ASSETS.routes.liveRoom,
    ariaLabel: "Live Room — Enter the sanctuary stage",
  },
  {
    id: "music",
    label: "Music",
    href: TENANT_DASHBOARD_ASSETS.routes.music,
    ariaLabel: "Music — Listen, download, and share",
  },
  {
    id: "prayer",
    label: "Prayer",
    href: TENANT_DASHBOARD_ASSETS.routes.prayer,
    ariaLabel: "Prayer — Leave a message of hope",
  },
] as const;

export const TENANT_DASHBOARD_CARDS_MOBILE = [
  TENANT_DASHBOARD_CARDS[0],
  TENANT_DASHBOARD_CARDS[3],
  TENANT_DASHBOARD_CARDS[1],
  TENANT_DASHBOARD_CARDS[2],
] as const;

export const TENANT_DASHBOARD_PRELOAD_ASSETS = [
  { href: TENANT_DASHBOARD_ASSETS.background, as: "video" as const },
  { href: TENANT_DASHBOARD_ASSETS.ianCraigStoryPoster, as: "image" as const },
  ...Object.values(TENANT_DASHBOARD_BUTTON_ASSETS).map((href) => ({
    href,
    as: "image" as const,
  })),
] as const;
