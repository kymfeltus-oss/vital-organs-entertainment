/** COLEMAN brand tokens — must match coleman.css luxury canvas + typography */
export const COLEMAN_BRAND = {
  logoCanvas: "#EDE1D7",
  bg: "#EDE1D7",
  bgBase: "#EDE1D7",
  bgHighlight: "#F8F3ED",
  bgCream: "#F4ECE3",
  bgChampagne: "#E7D8C8",
  bgShadow: "#D9C8B5",
  bgPrimary: "#EDE1D7",
  bgSecondary: "#D9C8B5",
  textPrimary: "#20170B",
  textSecondary: "#6F6353",
  textMuted: "#ACA092",
  champagne: "#926134",
  bronze: "#48351E",
  glassBorder: "rgba(255, 255, 255, 0.70)",
  glassFill: "rgba(255, 255, 255, 0.32)",
  glassHighlight: "rgba(255, 255, 255, 0.95)",
  glassHighlightSoft: "rgba(255, 255, 255, 0.55)",
  shadowLight: "#D3C5BB",
  shadowMedium: "#C8B9AC",
  divider: "rgba(111, 99, 83, 0.18)",
  surface: "rgba(255, 255, 255, 0.32)",
  border: "rgba(255, 255, 255, 0.70)",
  accentGold: "#926134",
  accentPlatinum: "rgba(255, 255, 255, 0.55)",
  glowStrong: "rgba(200, 185, 172, 0.58)",
  liveRed: "#C45C5C",
} as const;

/** Radial gradient stops for luxury canvas (center → edge) */
export const COLEMAN_CANVAS_GRADIENT = [
  COLEMAN_BRAND.bgHighlight,
  COLEMAN_BRAND.bgCream,
  COLEMAN_BRAND.bgBase,
  COLEMAN_BRAND.bgChampagne,
  COLEMAN_BRAND.bgShadow,
] as const;

/** Legacy alias used by Expo home components */
export const HOME_TOKENS = {
  bgCream: COLEMAN_BRAND.bgHighlight,
  bgNude: COLEMAN_BRAND.bgBase,
  bgTaupe: COLEMAN_BRAND.bgShadow,
  textPrimary: COLEMAN_BRAND.textPrimary,
  textSecondary: COLEMAN_BRAND.textSecondary,
  textMuted: COLEMAN_BRAND.textMuted,
  glassBg: COLEMAN_BRAND.glassFill,
  glassBorder: COLEMAN_BRAND.glassBorder,
  accentChampagne: COLEMAN_BRAND.champagne,
  accentBronze: COLEMAN_BRAND.bronze,
  accentGlow: COLEMAN_BRAND.glowStrong,
  liveRed: COLEMAN_BRAND.liveRed,
  espresso: COLEMAN_BRAND.textPrimary,
} as const;
