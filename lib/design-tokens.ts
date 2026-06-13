/** 300 Awakening — canonical design tokens (Phase 1 source of truth) */

export const BRAND_COLORS = {
  black: "#000000",
  panel: "#090B13",
  blue: "#00A8FF",
  pink: "#FF008C",
  purple: "#8A2BE2",
  indigo: "#5B42FF",
  white: "#FFFFFF",
  muted: "rgba(255,255,255,0.68)",
  border: "rgba(255,255,255,0.08)",
} as const;

export const BRAND_GRADIENTS = {
  brand: "linear-gradient(90deg, #00A8FF 0%, #5B42FF 50%, #FF008C 100%)",
  brandSoft:
    "linear-gradient(90deg, rgba(0,168,255,0.25) 0%, rgba(255,0,140,0.25) 100%)",
  ring: "linear-gradient(90deg, #00A8FF 0%, #8A2BE2 50%, #FF008C 100%)",
} as const;

export const BRAND_FONTS = {
  headline: "var(--font-headline)",
  ui: "var(--font-ui)",
  body: "var(--font-body)",
  cardTitle: "var(--font-card-title)",
} as const;

export const BRAND_SHADOWS = {
  neonBlue: "0 0 40px rgba(0,168,255,0.4)",
  neonPink: "0 0 40px rgba(255,0,140,0.4)",
  neonDual: "0 0 40px rgba(255,0,140,0.4), 0 0 40px rgba(0,168,255,0.4)",
  pillCta: "0 0 35px rgba(255,0,140,0.45), 0 0 35px rgba(0,168,255,0.45)",
  panel: "0 0 34px rgba(0,0,0,0.45)",
} as const;

export type BrandColorKey = keyof typeof BRAND_COLORS;
