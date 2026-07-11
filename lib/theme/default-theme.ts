import type { TenantTheme } from "@/lib/theme/types";
import {
  FAITH_BRAND_COLORS,
  FAITH_BRAND_FULL_NAME,
  FAITH_BRAND_MESSAGING,
} from "@/lib/theme/faith-brand-guidelines";

const { background, gold, text, border, card } = FAITH_BRAND_COLORS;

/** PΛRΛBLE FAITH OS fallback theme — used when no tenant row resolves. */
export const DEFAULT_TENANT_THEME: TenantTheme = {
  appName: FAITH_BRAND_FULL_NAME,
  tagline: FAITH_BRAND_MESSAGING.taglineExtended,
  logoUrl: "/tenant-default/dashboard/flagship-logo.png",
  logoUrlDark: "/tenant-default/dashboard/flagship-logo.png",
  faviconUrl: null,
  heroImageUrl: null,
  contact: {
    email: "sanctuary@parableos.faith",
    website: "https://parableos.faith",
    mailSubjectPrefix: `Contact from ${FAITH_BRAND_FULL_NAME}`,
  },
  socialLinks: [],
  colors: {
    primary: gold.primary,
    secondary: gold.deep,
    background: background.primary,
    surface: card.background,
    text: text.primary,
    textMuted: text.muted,
    accent: gold.bright,
    border: border.card,
  },
  fonts: {
    headline: "var(--font-space-grotesk), var(--font-inter), sans-serif",
    body: "var(--font-inter), sans-serif",
    ui: "var(--font-inter), sans-serif",
  },
  layout: {
    navStyle: "bottom",
    showFooter: false,
    footerText: "",
  },
  features: {
    showMusic: true,
    showGiving: true,
    showBuySeeds: true,
    showPrayer: true,
    showStory: true,
    showLive: true,
  },
};

export const defaultTheme = DEFAULT_TENANT_THEME;
