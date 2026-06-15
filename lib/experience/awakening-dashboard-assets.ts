/** Canonical /experience dashboard assets — public/awakening only */

export const AWAKENING_ASSETS = {
  backgrounds: {
    concert: "/awakening/dashboard-concert-bg.png",
  },
  branding: {
    mark: "/awakening/branding/300-awakening-mark.png",
  },
  ui: {
    navActivePill: "/awakening/ui/nav-active-pill.png",
  },
  icons: {
    liveRoom: "/awakening/icons/live-room-icon.svg",
    music: "/awakening/icons/music-icon.svg",
    prayer: "/awakening/icons/prayer-icon.svg",
    vitalSeed: "/awakening/icons/vital-seed-icon.svg",
  },
} as const;

export const AWAKENING_PRELOAD_ASSETS = [AWAKENING_ASSETS.backgrounds.concert] as const;

export type ExperienceNavItem = {
  id: string;
  label: string;
  href: string;
  icon: string;
  match?: "exact" | "prefix";
};

export const EXPERIENCE_DASHBOARD_NAV: ExperienceNavItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/experience",
    icon: AWAKENING_ASSETS.branding.mark,
    match: "exact",
  },
  {
    id: "live",
    label: "Live",
    href: "/experience/live",
    icon: AWAKENING_ASSETS.icons.liveRoom,
    match: "prefix",
  },
  {
    id: "music",
    label: "Music",
    href: "/experience/music",
    icon: AWAKENING_ASSETS.icons.music,
    match: "prefix",
  },
  {
    id: "prayer",
    label: "Prayer",
    href: "/experience/prayer",
    icon: AWAKENING_ASSETS.icons.prayer,
    match: "prefix",
  },
  {
    id: "seed",
    label: "Seed",
    href: "/experience/giving",
    icon: AWAKENING_ASSETS.icons.vitalSeed,
    match: "prefix",
  },
];
