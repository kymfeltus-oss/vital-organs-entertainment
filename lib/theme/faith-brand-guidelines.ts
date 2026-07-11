/**
 * PΛRΛBLE FAITH OS — official brand guidelines (single source of truth).
 * Enterprise streaming infrastructure for ministries.
 */

export const FAITH_BRAND_WORDMARK = "PΛRΛBLE";
export const FAITH_BRAND_SECONDARY_MARK = "FAITH OS";
export const FAITH_BRAND_FULL_NAME = "PΛRΛBLE FAITH OS";

export const FAITH_BRAND_POSITION =
  "Enterprise streaming infrastructure for ministries.";

export const FAITH_BRAND_PERSONALITY = [
  "Sophisticated",
  "Executive",
  "Architectural",
  "Minimal",
  "Premium",
  "Cinematic",
  "Broadcast-grade",
  "Confident",
  "Quiet",
  "Timeless",
] as const;

export const FAITH_BRAND_COLORS = {
  background: {
    primary: "#000000",
    secondary: "#050505",
    midnight: "#0A0906",
    bronzeShadow: "#171208",
  },
  gold: {
    primary: "#F5B400",
    bright: "#FFC533",
    deep: "#C48A00",
    bronze: "#8F6500",
  },
  text: {
    primary: "#FFFFFF",
    secondary: "#D5D5D5",
    muted: "#9B9B9B",
    body: "#B3B3B3",
    disabled: "#707070",
  },
  border: {
    default: "#242424",
    hover: "#F5B400",
    card: "#252525",
    secondary: "#2A2A2A",
  },
  card: {
    background: "#121212",
  },
  button: {
    primaryBackground: "#F5B400",
    primaryText: "#111111",
    secondaryBorder: "#2A2A2A",
    hover: "#FFC533",
  },
} as const;

export const FAITH_BRAND_TYPOGRAPHY = {
  heroHeadline: {
    families: ["Space Grotesk", "Neue Haas Grotesk Display", "SF Pro Display", "Satoshi"],
    weight: "700",
    letterSpacing: "-0.03em",
  },
  navigation: {
    families: ["Inter", "SF Pro Text", "Space Grotesk"],
    weight: "500",
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
  },
  body: {
    family: "Inter",
    weight: "400",
    color: FAITH_BRAND_COLORS.text.body,
  },
  label: {
    family: "Inter",
    weight: "600",
    letterSpacing: "0.28em",
    textTransform: "uppercase" as const,
    color: FAITH_BRAND_COLORS.gold.primary,
  },
} as const;

export const FAITH_BRAND_SPACING = {
  maxWidth: "1600px",
  contentWidth: "1320px",
  sectionPadding: "120px",
} as const;

export const FAITH_BRAND_RADIUS = {
  button: "8px",
  card: "12px",
  input: "10px",
  badge: "999px",
} as const;

export const FAITH_BRAND_SHADOWS = {
  card: "0 25px 70px rgba(0,0,0,0.55)",
  button: "0 10px 35px rgba(245,180,0,0.18)",
} as const;

export const FAITH_BRAND_HERO_GRADIENT = [
  "radial-gradient(circle at right, rgba(245,180,0,0.12), transparent 45%)",
  "linear-gradient(180deg, #050505, #000000)",
].join(", ");

export const FAITH_BRAND_MESSAGING = {
  tagline: "Own Your Stream. Own Your Brand.",
  taglineExtended: "Own Your Sanctuary. Own Your Stream. Own Your Ministry.",
  headlines: [
    "Own Your Stream. Own Your Brand.",
    "Broadcast Without Compromise.",
    "The Operating System for Modern Ministry.",
    "Enterprise Streaming for Churches That Lead.",
    "Your Ministry. Your Platform. Your Audience.",
  ],
} as const;

/** CSS custom properties for document-level theming. */
export function faithBrandCssVariables(): Record<string, string> {
  const { background, gold, text, border, card, button } = FAITH_BRAND_COLORS;

  return {
    "--faith-bg-primary": background.primary,
    "--faith-bg-secondary": background.secondary,
    "--faith-bg-midnight": background.midnight,
    "--faith-gold-primary": gold.primary,
    "--faith-gold-bright": gold.bright,
    "--faith-gold-deep": gold.deep,
    "--faith-gold-bronze": gold.bronze,
    "--faith-text-primary": text.primary,
    "--faith-text-secondary": text.secondary,
    "--faith-text-muted": text.muted,
    "--faith-text-body": text.body,
    "--faith-border-default": border.default,
    "--faith-border-card": border.card,
    "--faith-card-bg": card.background,
    "--faith-btn-primary-bg": button.primaryBackground,
    "--faith-btn-primary-text": button.primaryText,
    "--faith-hero-gradient": FAITH_BRAND_HERO_GRADIENT,
    "--faith-shadow-card": FAITH_BRAND_SHADOWS.card,
    "--faith-shadow-button": FAITH_BRAND_SHADOWS.button,
    "--faith-radius-button": FAITH_BRAND_RADIUS.button,
    "--faith-radius-card": FAITH_BRAND_RADIUS.card,
    "--faith-radius-input": FAITH_BRAND_RADIUS.input,
    "--faith-max-width": FAITH_BRAND_SPACING.maxWidth,
    "--faith-content-width": FAITH_BRAND_SPACING.contentWidth,
  };
}

/** Gold glow RGBA helper for inline styles and shadows. */
export function faithGoldRgb(alpha: number): string {
  return `rgba(245,180,0,${alpha})`;
}
