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

export const AWAKENING_ASSETS = {
  background: "/awakening/dashboard-concert-bg%20mobile.mp4",
  routes: {
    enterExperience: "/experience/live",
    watchStory: "/",
    giving: "/experience/giving",
    liveRoom: "/experience/live",
    music: "/music",
    prayer: "/experience/prayer",
  },
} as const;

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
] as const;
