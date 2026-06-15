/** Experience dashboard raster assets — backdrops + approved UI button art. */

/** Source art dimensions — keep in sync with PNG files in `public/awakening/`. */
export const AWAKENING_CONCERT_BACKDROP_ART = {
  desktop: { width: 1536, height: 1024 },
  mobile: { width: 853, height: 1844 },
} as const;

export const AWAKENING_ASSETS = {
  backgrounds: {
    concert: "/awakening/dashboard-concert-bg.png",
    concertMobile: "/awakening/dashboard-concert-bg-mobile.png",
  },
  ui: {
    enterExperience: "/awakening/ui/enter-experience-button.png",
    watchStory: "/awakening/ui/watch-story-button.png",
    cards: {
      vitalSeed: "/awakening/card%20vital%20seed.png",
      live: "/awakening/card%20live.png",
      music: "/awakening/card%20music.png",
      prayer: "/awakening/card%20prayer.png",
    },
  },
  routes: {
    /** Live attendee room — same target as lobby + nav Live tab */
    enterExperience: "/experience/live",
    /** Cinematic intro / Ian's story (root VideoIntroExperience) */
    watchStory: "/",
    giving: "/experience/giving",
    liveRoom: "/experience/live",
    music: "/music",
    prayer: "/experience/prayer",
  },
} as const;

/** Source art 1774×887 (~2:1) — both hero CTA pills. */
export const AWAKENING_CTA_ASPECT = 887 / 1774;

/** Shared display aspect for equal-sized hero card cells. */
export const AWAKENING_DASHBOARD_CARD_ASPECT = 1693 / 929;

/** Individual hero feature cards — source dimensions from PNG files. */
export const AWAKENING_DASHBOARD_CARDS = [
  {
    id: "giving",
    src: AWAKENING_ASSETS.ui.cards.vitalSeed,
    width: 1942,
    height: 809,
    href: AWAKENING_ASSETS.routes.giving,
    label: "Vital Seed Giving — Every gift has a frequency",
  },
  {
    id: "live",
    src: AWAKENING_ASSETS.ui.cards.live,
    width: 1808,
    height: 870,
    href: AWAKENING_ASSETS.routes.liveRoom,
    label: "Live Room — Enter the sanctuary stage",
  },
  {
    id: "music",
    src: AWAKENING_ASSETS.ui.cards.music,
    width: 1693,
    height: 929,
    href: AWAKENING_ASSETS.routes.music,
    label: "Music — Listen, download, and share",
  },
  {
    id: "prayer",
    src: AWAKENING_ASSETS.ui.cards.prayer,
    width: 1672,
    height: 941,
    href: AWAKENING_ASSETS.routes.prayer,
    label: "Prayer — Leave a message of hope",
  },
] as const;

export const AWAKENING_PRELOAD_ASSETS = [
  AWAKENING_ASSETS.backgrounds.concert,
  AWAKENING_ASSETS.backgrounds.concertMobile,
  AWAKENING_ASSETS.ui.enterExperience,
  AWAKENING_ASSETS.ui.watchStory,
  ...AWAKENING_DASHBOARD_CARDS.map((card) => card.src),
] as const;
