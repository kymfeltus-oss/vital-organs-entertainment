/**
 * Canonical dashboard asset map — use existing files only, do not recreate.
 * @see public/backgrounds/
 */
export const AWAKENING_ASSETS = {
  /** Experience hub uses compositeStage; layered plates kept for legacy DashboardBackground only. */
  compositeStage: "/assets/backgrounds/300-awakening-stage-performers.webp",
  /** @deprecated Legacy multi-layer plates — not used on /experience hub. */
  background: {
    base: "/backgrounds/concert-stage-bg.webp",
    performers: "/backgrounds/stage-performers-overlay.png",
    lightBeams: "/backgrounds/light-beams-overlay.png",
    crowd: "/backgrounds/concert-crowd-overlay.png",
  },
  /** Top-left logo when the scene background is not sharp enough. */
  logo: "/assets/branding/300-awakening-logo.png",
  story: {
    primary: "/assets/story/ian-craig-dialysis-story.png",
    fallback: "/assets/mission/ian-story-thumbnail.png",
  },
  ambient: {
    primary: "/assets/audio/ambient-worship.mp3",
    fallback: "/assets/audio/ambient-worship.m4a",
  },
  ui: {
    waveformPink: "/assets/ui/waveform-pink.svg",
    waveformBlue: "/assets/ui/waveform-blue.svg",
    neonChevron: "/assets/ui/neon-chevron.svg",
  },
  orbs: {
    giving: "/assets/orbs/vital-seed-orb.png",
    single: "/assets/orbs/new-single-orb.png",
    connected: "/assets/orbs/stay-connected-orb.png",
    encourage: "/assets/orbs/encourage-ian-orb.png",
  },
  optional: {
    waveformOverlay: "/effects/waveform-overlay.png",
    playIconBlue: "/icons/play-icon-blue.png",
    singleAlbumBackup: "/images/hallelujah-anyhow-cover.png",
  },
} as const;

export const AWAKENING_COLORS = {
  black: "#020208",
  pink: "#FF007F",
  magenta: "#FF20DF",
  purple: "#7B2DFF",
  cyan: "#00E6FF",
  white: "#FFFFFF",
  muted: "rgba(255,255,255,0.68)",
} as const;

export const ORB_ITEMS = [
  {
    id: "giving",
    label: "VITAL SEED GIVING",
    description: "Every gift has a frequency.",
    image: AWAKENING_ASSETS.orbs.giving,
    href: "/experience/giving",
    labelColor: AWAKENING_COLORS.pink,
    glow: "shadow-[0_0_36px_rgba(123,45,255,0.75)]",
    ringClass: "bg-gradient-to-br from-[#7B2DFF] via-[#FF007F] to-[#FF20DF]",
  },
  {
    id: "single",
    label: "NEW SINGLE OUT NOW",
    description: "Support the mission. Download & share.",
    image: AWAKENING_ASSETS.orbs.single,
    imageFallback: AWAKENING_ASSETS.optional.singleAlbumBackup,
    href: "/experience/music",
    labelColor: AWAKENING_COLORS.pink,
    glow: "shadow-[0_0_36px_rgba(255,0,127,0.75)]",
    ringClass: "bg-gradient-to-br from-[#FF007F] via-[#FF20DF] to-[#7B2DFF]",
  },
  {
    id: "connected",
    label: "STAY CONNECTED",
    description: "Follow updates, events and mission news.",
    image: AWAKENING_ASSETS.orbs.connected,
    href: "/updates",
    labelColor: AWAKENING_COLORS.cyan,
    glow: "shadow-[0_0_36px_rgba(0,230,255,0.75)]",
    ringClass: "bg-gradient-to-br from-[#00E6FF] via-[#7B2DFF] to-[#00E6FF]",
  },
  {
    id: "encourage",
    label: "ENCOURAGE IAN",
    description: "Leave a public message of hope and strength.",
    image: AWAKENING_ASSETS.orbs.encourage,
    href: "/experience/prayer",
    labelColor: AWAKENING_COLORS.pink,
    glow: "shadow-[0_0_36px_rgba(255,32,223,0.75)]",
    ringClass: "bg-gradient-to-br from-[#FF20DF] via-[#FF007F] to-[#7B2DFF]",
  },
] as const;

export function resolveAmbientAudio(override?: string | null) {
  const primary = override?.trim() || AWAKENING_ASSETS.ambient.primary;
  return {
    primary,
    fallback: AWAKENING_ASSETS.ambient.fallback,
  };
}
