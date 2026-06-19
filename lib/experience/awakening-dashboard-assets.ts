/** Experience dashboard — mobile video backdrop + route targets. */

/** Fixed mobile dashboard artboard — logo lives in the flat background plate. */
export const AWAKENING_DASHBOARD_ARTBOARD = {
  width: 1080,
  height: 1920,
} as const;

/** Fallback art dimensions until video metadata loads — tune if export size differs. */
/** Portrait plate; rendered with object-fit: contain + object-position: center top. */
export const AWAKENING_CONCERT_BACKDROP_ART = {
  width: AWAKENING_DASHBOARD_ARTBOARD.width,
  height: AWAKENING_DASHBOARD_ARTBOARD.height,
} as const;

export const AWAKENING_MOBILE_DASHBOARD_VIEWPORT = {
  width: 390,
  height: 844,
} as const;

/** 9:16 portrait dashboard plate — fluid on all viewports (no phone-frame clamp). */
export const AWAKENING_DASHBOARD_CONTAINER = {
  aspectWidth: 9,
  aspectHeight: 16,
} as const;

/** PNG button grid — scaled overlay footprint on mobile artboard. */
export const AWAKENING_DASHBOARD_BUTTON_GRID_SCALE = 0.85 as const;

/** Overlay layout — native 1080×1920 artboard coordinates (px). */
export const AWAKENING_DASHBOARD_OVERLAY_LAYOUT = {
  artboardWidth: AWAKENING_DASHBOARD_ARTBOARD.width,
  artboardHeight: AWAKENING_DASHBOARD_ARTBOARD.height,
  safeArea: {
    top: 60,
    right: 40,
    bottom: 52,
    left: 40,
  },
  /** Baked AWAKENING logo + glow clear zone ends at this Y (tuned to video plate). */
  logoClearBottomY: 632,
  /** Minimum space between logo clear zone and Ian Craig story card. */
  logoToStoryMinGap: 32,
  /** Uniform scale for 2×2 button cards. */
  cardScale: AWAKENING_DASHBOARD_BUTTON_GRID_SCALE,
  /** Ian Craig story banner — slightly larger for readable copy. */
  storyCardScale: 0.96,
  /** Uniform gutter between all five cards — story, rows, and columns (1080 artboard px). */
  overlayCardGap: 6,
  /** Scales all grid PNG art to align visible borders with Ian Craig story edges. */
  gridCardImageScale: 1.14,
  /** Extra nudge below story card — use overlayCardGap for primary rhythm. */
  gridTopOffset: 0,
  /**
   * Min artboard scroll height at 1080px reference width — ensures Vital/Prayer row
   * clears the bottom safe area (story top + cards + gaps + bottom inset).
   */
  artboardScrollHeight: 2420,
} as const;

export const AWAKENING_DASHBOARD_STORY_TOP_Y =
  AWAKENING_DASHBOARD_OVERLAY_LAYOUT.logoClearBottomY +
  AWAKENING_DASHBOARD_OVERLAY_LAYOUT.logoToStoryMinGap;

/** Wire creator portrait stream URL when the event feed is live. */
export const AWAKENING_CREATOR_STREAM_SRC: string | null = null;

export const AWAKENING_ASSETS = {
  background: "/awakening/dashboard-concert-bg%20mobile.mp4",
  logo: "/branding/awakening-lockup.png",
  welcomeHeader: "/awakening/300_dashboard_assets/welcome_header.png",
  /** 3:2 story poster — swap to MP4 via `ianCraigStoryVideo` when ready. */
  ianCraigStoryPoster: "/awakening/300_dashboard_assets/ian%20craig%20story.png",
  ianCraigStoryVideo: null as string | null,
  routes: {
    enterExperience: "/experience/live",
    watchStory: "/",
    giving: "/experience/giving",
    liveRoom: "/experience/live",
    music: "/experience/music",
    prayer: "/experience/prayer",
  },
} as const;

/** PNG button art for the experience dashboard 2×2 grid. */
export const AWAKENING_DASHBOARD_BUTTON_ASSETS = {
  music: "/awakening/300_dashboard_assets/music_button.png",
  live: "/awakening/300_dashboard_assets/live_button.png",
  giving: "/awakening/300_dashboard_assets/vital_seed_giving_button.png",
  prayer: "/awakening/300_dashboard_assets/prayer_contact_button.png",
} as const;

/** 2×2 grid order: top-left → top-right → bottom-left → bottom-right. */
export const AWAKENING_DASHBOARD_BUTTON_GRID = [
  {
    id: "music",
    href: AWAKENING_ASSETS.routes.music,
    src: AWAKENING_DASHBOARD_BUTTON_ASSETS.music,
    ariaLabel: "Music — Listen, download, and share",
  },
  {
    id: "live",
    href: AWAKENING_ASSETS.routes.liveRoom,
    src: AWAKENING_DASHBOARD_BUTTON_ASSETS.live,
    ariaLabel: "Live Room — Enter the sanctuary stage",
  },
  {
    id: "giving",
    href: AWAKENING_ASSETS.routes.giving,
    src: AWAKENING_DASHBOARD_BUTTON_ASSETS.giving,
    ariaLabel: "Vital Seed Giving — Every gift has a frequency",
  },
  {
    id: "prayer",
    href: AWAKENING_ASSETS.routes.prayer,
    src: AWAKENING_DASHBOARD_BUTTON_ASSETS.prayer,
    ariaLabel: "Prayer — Leave a message of hope",
  },
] as const;

export const AWAKENING_DASHBOARD_CARDS = [
  {
    id: "giving",
    label: "Vital Seed",
    href: AWAKENING_ASSETS.routes.giving,
    ariaLabel: "Vital Seed Giving — Every gift has a frequency",
  },
  {
    id: "live",
    label: "Live Room",
    href: AWAKENING_ASSETS.routes.liveRoom,
    ariaLabel: "Live Room — Enter the sanctuary stage",
  },
  {
    id: "music",
    label: "Music",
    href: AWAKENING_ASSETS.routes.music,
    ariaLabel: "Music — Listen, download, and share",
  },
  {
    id: "prayer",
    label: "Prayer",
    href: AWAKENING_ASSETS.routes.prayer,
    ariaLabel: "Prayer — Leave a message of hope",
  },
] as const;

/** Mobile 2×2 grid — warm cards diagonal, not adjacent. */
export const AWAKENING_DASHBOARD_CARDS_MOBILE = [
  AWAKENING_DASHBOARD_CARDS[0],
  AWAKENING_DASHBOARD_CARDS[3],
  AWAKENING_DASHBOARD_CARDS[1],
  AWAKENING_DASHBOARD_CARDS[2],
] as const;

export const AWAKENING_PRELOAD_ASSETS = [
  { href: AWAKENING_ASSETS.background, as: "video" as const },
  { href: AWAKENING_ASSETS.ianCraigStoryPoster, as: "image" as const },
  ...Object.values(AWAKENING_DASHBOARD_BUTTON_ASSETS).map((href) => ({
    href,
    as: "image" as const,
  })),
] as const;
