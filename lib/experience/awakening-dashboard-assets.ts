/** Experience dashboard — mobile video backdrop + route targets. */

/** Fallback art dimensions until video metadata loads — tune if export size differs. */
/** Portrait plate; rendered with object-fit: contain + object-position: center top. */
export const AWAKENING_CONCERT_BACKDROP_ART = {
  width: 941,
  height: 1672,
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

/** Tall creator portrait slot — centered in the upper half of the dashboard. */
export const AWAKENING_CREATOR_SLOT = {
  maxHeightPercent: 46,
  aspectWidth: 9,
  aspectHeight: 16,
} as const;

/** PNG button grid scale relative to native art (0.75 = compact but legible on mobile). */
export const AWAKENING_DASHBOARD_BUTTON_GRID_SCALE = 0.75 as const;

/** Wire creator talking-head stream URL when the event feed is live. */
export const AWAKENING_CREATOR_STREAM_SRC: string | null = null;

export const AWAKENING_ASSETS = {
  background: "/awakening/dashboard-concert-bg%20mobile.mp4",
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
  { href: "/branding/awakening-lockup.png", as: "image" as const },
  ...Object.values(AWAKENING_DASHBOARD_BUTTON_ASSETS).map((href) => ({
    href,
    as: "image" as const,
  })),
] as const;
