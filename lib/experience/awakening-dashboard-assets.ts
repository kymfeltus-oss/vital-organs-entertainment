/** Experience dashboard — single mobile layout backdrop + route targets. */

/** Source art dimensions — keep in sync with `public/awakening/dashboard-concert-bg.png`. */
/** Art aspect ≈ 390×844 mobile design canvas; rendered with object-fit: fill to 100dvh. */
export const AWAKENING_CONCERT_BACKDROP_ART = {
  width: 853,
  height: 1844,
} as const;

export const AWAKENING_MOBILE_DASHBOARD_VIEWPORT = {
  width: 390,
  height: 844,
} as const;

export const AWAKENING_ASSETS = {
  background: "/awakening/dashboard-concert-bg.png",
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
  AWAKENING_ASSETS.background,
  "/branding/awakening-lockup.png",
] as const;
