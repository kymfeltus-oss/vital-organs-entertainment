import type { Transition, Variants } from "framer-motion";

/** Experience hub — single source of truth for colors, assets, layout, motion, and UI classes. */

export const HUB_SPEC_COLORS = {
  bg: "#030308",
  panel: "rgba(5, 8, 18, 0.72)",
  hotPink: "#FF007F",
  magenta: "#FF20DF",
  purple: "#7B2DFF",
  cyan: "#00E6FF",
  blue: "#006EFF",
  white: "#FFFFFF",
  muted: "rgba(255, 255, 255, 0.72)",
  /** @deprecated Use hotPink — kept for existing hub components */
  pink: "#FF007F",
  /** @deprecated Use magenta — kept for existing hub components */
  neonPink: "#FF20DF",
} as const;

export const HUB_SPEC_GLOWS = {
  hotPink: "0 0 20px rgba(255, 0, 127, 0.65)",
  magenta: "0 0 24px rgba(255, 32, 223, 0.55)",
  purple: "0 0 22px rgba(123, 45, 255, 0.5)",
  cyan: "0 0 20px rgba(0, 230, 255, 0.55)",
  dual: "0 0 18px rgba(255, 0, 127, 0.65), 0 0 28px rgba(0, 110, 255, 0.38)",
  welcomeBanner:
    "0 0 24px rgba(255, 0, 127, 0.55), 0 0 34px rgba(0, 110, 255, 0.35)",
  missionCard:
    "0 0 18px rgba(255, 0, 127, 0.45), 0 0 28px rgba(0, 110, 255, 0.25)",
  orbOuter:
    "0 0 20px rgba(255, 0, 127, 0.5), 0 0 30px rgba(0, 110, 255, 0.35)",
  /** @deprecated */
  pink: "0 0 20px rgba(255, 0, 127, 0.65)",
  /** @deprecated */
  neonPink: "0 0 24px rgba(255, 32, 223, 0.55)",
} as const;

/** Optional master plate treatment — single background only. */
export const EXPERIENCE_SCENE_FILTERS = {
  master: "contrast(1.08) saturate(1.1) brightness(0.94)",
} as const;

/** @deprecated Replaced by EXPERIENCE_SCENE_VIGNETTE — dark radial only, no bottom wash. */
export const EXPERIENCE_SCENE_COLOR_GRADE =
  "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 55%, rgba(0,0,0,0.45) 100%)";

/** Dark vignette — subtle; does not shift Image 157 depth hierarchy. */
export const EXPERIENCE_SCENE_VIGNETTE =
  "radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,.72) 100%)";

/** Experience hub scene + UI stacking order (Tailwind z-[n]). */
export const EXPERIENCE_SCENE_Z = {
  base: 0,
  vignette: 1,
  ui: 50,
  missionCard: 50,
  orbs: 60,
  header: 70,
  audio: 80,
} as const;

/** Canonical artboard — master stage plate pixel size (Image 157). */
export const MASTER_STAGE_ART = {
  width: 1535,
  height: 1024,
  aspect: 1535 / 1024,
} as const;

/**
 * Image 157 composition anchors (% of master artboard at 1535×1024).
 * Used to align UI overlays with baked stage elements — do not rescale artwork.
 */
export const MASTER_STAGE_COMPOSITION = {
  /** Bottom-anchored plate — preserves audience floor + singer baseline. */
  anchor: "bottom center" as const,
  leftCross: { xPct: 10.0, yPct: 46.8 },
  rightCross: { xPct: 90.0, yPct: 46.8 },
  singerBaselinePct: 68,
  audienceBandTopPct: 65,
  /** UI logo — same artboard as EXPERIENCE_HUB_LAYOUT; centered above left cross X. */
  logoTopPx: 44,
  logoLeftOfCrossCenterPx: 120,
} as const;

/** Capacitor / mobile viewport framing — CSS in styles/awakening.css */
export const MASTER_STAGE_MOBILE = {
  portrait: {
    maxWidthPx: 767,
    plateObjectFit: "cover" as const,
    plateObjectPosition: "center 58%",
  },
  landscape: {
    maxWidthPx: 767,
    plateObjectFit: "fill" as const,
    plateObjectPosition: "bottom center" as const,
  },
  /** Prefer dynamic viewport height (not 100vh) for WebView chrome */
  viewportUnit: "100dvh" as const,
} as const;

/** @deprecated Use MASTER_STAGE_ART — kept for legacy references. */
export const COMPOSITE_STAGE_ART = MASTER_STAGE_ART;

export const ACTUAL_ASSET_MAP = {
  logo: "/assets/branding/300-awakening-logo.png",
  logoFallback: "/branding/300-awakening-logo.png",
  /** Single master stage plate for /experience — audience, singers, crosses, lighting. */
  masterStageBackground: "/assets/experience/master-stage-background.webp",
  backgroundStage: "/assets/experience/master-stage-background.webp",
  /** @deprecated Legacy composite — use masterStageBackground. */
  compositeStage: "/assets/backgrounds/300-awakening-stage-performers.webp",
  compositeStageBgSize: "100% auto",
  compositeStageBgPosition: "center top",
  /** @deprecated Legacy multi-layer plates — not used on /experience hub. */
  sceneLayers: {
    base: "/backgrounds/concert-stage-bg.webp",
    performers: "/backgrounds/stage-performers-overlay.png",
    lightBeams: null as string | null,
    crowd: "/backgrounds/concert-crowd-overlay.png",
  },
  missionImage: "/assets/story/ian-craig-dialysis-story.png",
  missionImageFallback: "/assets/mission/ian-story-thumbnail.png",
  orbs: {
    vitalSeed: "/assets/orbs/orb-waveform.png",
    newSingle: "/assets/orbs/new-single-orb.png",
    newSingleFallback: "/assets/orbs/orb-single-cover.png",
    stayConnected: "/assets/orbs/orb-community.png",
    encourageIan: "/assets/orbs/orb-encourage.png",
    encourageIanFallback: "/assets/orbs/encourage-ian-orb.png",
  },
  ambientPrimary: "/assets/audio/ambient-worship.mp3",
  ambientFallback: "/assets/audio/ambient-worship.m4a",
  ui: {
    neonChevron: "/assets/ui/neon-chevron.svg",
    waveformPink: "/assets/ui/waveform-pink.svg",
    waveformBlue: "/assets/ui/waveform-blue.svg",
  },
} as const;

/** @deprecated Use ACTUAL_ASSET_MAP — kept for hub-content loaders */
/** @deprecated Use ACTUAL_ASSET_MAP.backgroundStage or sceneLayers.base for the experience hub background. */
export const HUB_DASHBOARD_BG = ACTUAL_ASSET_MAP.backgroundStage;

/** @deprecated Use ACTUAL_ASSET_MAP.sceneLayers */
export const HUB_DASHBOARD_LAYERS = ACTUAL_ASSET_MAP.sceneLayers;

/** @deprecated Use ACTUAL_ASSET_MAP */
export const HUB_SPEC_ASSETS = {
  dashboardBg: ACTUAL_ASSET_MAP.backgroundStage,
  logo: ACTUAL_ASSET_MAP.logo,
  missionThumb: ACTUAL_ASSET_MAP.missionImage,
  missionThumbFallback: ACTUAL_ASSET_MAP.missionImageFallback,
  orbs: {
    giving: ACTUAL_ASSET_MAP.orbs.vitalSeed,
    single: ACTUAL_ASSET_MAP.orbs.newSingle,
    connected: ACTUAL_ASSET_MAP.orbs.stayConnected,
    encourage: ACTUAL_ASSET_MAP.orbs.encourageIan,
  },
  ambientPrimary: ACTUAL_ASSET_MAP.ambientPrimary,
  ambientFallback: ACTUAL_ASSET_MAP.ambientFallback,
} as const;

/** 1440×1024 reference artboard — desktop UI positions scale as % of this frame. */
export const EXPERIENCE_HUB_LAYOUT = {
  width: 1440,
  height: 1024,
  logo: { top: 44, left: 64, width: 240, minWidth: 220, maxWidth: 260, mobileWidth: 120 },
  welcome: { top: 44, width: 960, minWidth: 560, height: 72, radius: 20, paddingX: 24 },
  profile: { top: 30, right: 42, size: 54 },
  menu: { top: 95, right: 52 },
  live: { top: 78, width: 130, height: 30 },
  headline: { top: 112, width: 760, fontSize: 52, lineHeight: 54, tracking: "0.055em" },
  subheadline: { top: 176, fontSize: 14, tracking: "0.14em" },
  portal: { top: 280, width: 980, minWidth: 760, height: 360, radius: 28 },
  orbs: { top: 670, size: 160, outerSize: 200, mobileSize: 110, outerMobileSize: 140, gap: 32 },
  ambient: { left: 28, bottom: 24, width: 310, height: 64 },
  tapHint: { bottom: 22, fontSize: 11 },
  sectionGap: 24,
} as const;

export function layoutTop(px: number): string {
  return `${(px / EXPERIENCE_HUB_LAYOUT.height) * 100}%`;
}

export function layoutLeft(px: number): string {
  return `${(px / EXPERIENCE_HUB_LAYOUT.width) * 100}%`;
}

export function layoutWidth(px: number): string {
  return `${(px / EXPERIENCE_HUB_LAYOUT.width) * 100}%`;
}

const fadeEase: Transition["ease"] = "easeOut";

export const MOTION_VARIANTS = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8, ease: fadeEase } },
  } satisfies Variants,
  orbFloat: (delay: number) => ({
    animate: {
      y: [0, -6, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut",
        delay,
      },
    },
  }),
  bloomDrift: {
    animate: {
      scale: [1, 1.15, 1],
      x: [0, 18, 0],
      y: [0, -10, 0],
      transition: {
        duration: 12,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut",
      },
    },
  },
  welcomePulse: {
    animate: {
      boxShadow: [
        "0 0 12px rgba(255,0,127,0.2)",
        "0 0 22px rgba(255,0,127,0.45)",
        "0 0 12px rgba(255,0,127,0.2)",
      ],
    },
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
} as const;

export const hubSpecClasses = {
  headline: "font-headline uppercase tracking-[0.08em] text-white",
  body: "font-ui text-[rgba(255,255,255,0.72)]",
  label: "font-ui font-bold uppercase tracking-[0.18em]",
  glassPortal:
    "rounded-[24px] border border-white/10 bg-[rgba(5,8,18,0.72)] backdrop-blur-xl",
  gradientBorder: "brand-gradient-border",
  welcomeCapsule:
    "rounded-full border border-white/10 bg-[rgba(5,8,18,0.72)] backdrop-blur-md brand-gradient-border",
  orbRing:
    "rounded-full border-2 border-transparent bg-gradient-to-br from-[#FF007F] via-[#7B2DFF] to-[#00E6FF] p-[2px]",
} as const;
