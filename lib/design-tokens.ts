/** @deprecated Prefer `lib/theme` — legacy tokens; faith palette aliases below. */

import { FAITH_BRAND_COLORS, FAITH_BRAND_SHADOWS } from "@/lib/theme/faith-brand-guidelines";

const { background, gold, text, border, card } = FAITH_BRAND_COLORS;

export const FAITH_BRAND_TOKENS = {
  colors: FAITH_BRAND_COLORS,
  shadows: FAITH_BRAND_SHADOWS,
} as const;

export const BRAND_COLORS = {
  black: background.primary,
  blackDeep: background.secondary,
  panel: card.background,
  blue: gold.primary,
  purple: gold.deep,
  pink: gold.bright,
  indigo: gold.bronze,
  white: text.primary,
  muted: text.muted,
  border: border.card,
} as const;

export const BRAND_GRADIENTS = {
  brand: `linear-gradient(90deg, ${gold.primary} 0%, ${gold.bright} 100%)`,
  brandSoft: `linear-gradient(90deg, rgba(245,180,0,0.25) 0%, rgba(255,197,51,0.25) 100%)`,
  ring: `linear-gradient(90deg, ${gold.primary} 0%, ${gold.bright} 100%)`,
} as const;

export const BRAND_TYPOGRAPHY = {
  lockup: {
    fontFamily: "var(--font-headline)",
    fontWeight: 400,
    letterSpacing: "0.22em",
    textTransform: "uppercase" as const,
  },
  byline: {
    fontFamily: "var(--font-ui)",
    fontWeight: 300,
    letterSpacing: "0.12em",
  },
  tagline: {
    fontFamily: "var(--font-ui)",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  },
  enter: {
    fontFamily: "var(--font-ui)",
    fontWeight: 500,
    letterSpacing: "0.10em",
    textTransform: "uppercase" as const,
  },
} as const;

export const BRAND_FONTS = {
  headline: "var(--font-headline)",
  ui: "var(--font-ui)",
  body: "var(--font-body)",
  cardTitle: "var(--font-card-title)",
} as const;

export const BRAND_SHADOWS = {
  glowBlue: FAITH_BRAND_SHADOWS.button,
  glowPurple: FAITH_BRAND_SHADOWS.card,
  glowPink: FAITH_BRAND_SHADOWS.button,
  neonBlue: FAITH_BRAND_SHADOWS.button,
  neonPink: FAITH_BRAND_SHADOWS.button,
  neonPurple: FAITH_BRAND_SHADOWS.card,
  neonDual: FAITH_BRAND_SHADOWS.button,
  pillCta: FAITH_BRAND_SHADOWS.button,
  panel: FAITH_BRAND_SHADOWS.card,
} as const;

export type BrandColorKey = keyof typeof BRAND_COLORS;
