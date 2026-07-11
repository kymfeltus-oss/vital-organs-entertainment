/** COLEMAN brand tokens — must match coleman.css luxury dark canvas + typography */
export const COLEMAN_BRAND = {
  logoCanvas: "#0A0D12",
  bg: "#0A0D12",
  bgBase: "#0A0D12",
  bgHighlight: "#10151C",
  bgCream: "#161B22",
  bgChampagne: "#1E242D",
  bgShadow: "#0A0D12",
  bgPrimary: "#0A0D12",
  bgSecondary: "#10151C",
  textPrimary: "#F5F2EA",
  textSecondary: "#B8B2A6",
  textMuted: "#7B766F",
  champagne: "#D6B37A",
  bronze: "#A47B49",
  glassBorder: "rgba(255, 255, 255, 0.12)",
  glassFill: "rgba(20, 24, 30, 0.55)",
  glassHighlight: "rgba(255, 255, 255, 0.18)",
  glassHighlightSoft: "rgba(255, 255, 255, 0.08)",
  shadowLight: "rgba(0, 0, 0, 0.28)",
  shadowMedium: "rgba(0, 0, 0, 0.45)",
  divider: "rgba(255, 255, 255, 0.08)",
  surface: "rgba(20, 24, 30, 0.55)",
  border: "rgba(255, 255, 255, 0.12)",
  accentGold: "#D6B37A",
  accentPlatinum: "#97E53A",
  accentLime: "#97E53A",
  glowStrong: "rgba(214, 179, 122, 0.42)",
  liveRed: "#97E53A",
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
