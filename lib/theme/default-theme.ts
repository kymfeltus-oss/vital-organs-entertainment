import type { TenantTheme } from "@/lib/theme/types";

/** Neutral default palette — swap via tenant config later without code changes. */
export const DEFAULT_TENANT_THEME: TenantTheme = {
  appName: "Parable Streaming",
  tagline: "Premium white-label media & community engine",
  logoUrl: null,
  logoUrlDark: null,
  faviconUrl: null,
  heroImageUrl: null,
  contact: {
    email: "support@example.com",
    website: "https://example.com",
    mailSubjectPrefix: "Contact from Parable Streaming",
  },
  socialLinks: [],
  colors: {
    primary: "#2563eb",
    secondary: "#64748b",
    background: "#0f172a",
    surface: "#1e293b",
    text: "#f8fafc",
    textMuted: "#94a3b8",
    accent: "#3b82f6",
    border: "rgba(148, 163, 184, 0.22)",
  },
  fonts: {
    headline: "var(--font-inter)",
    body: "var(--font-inter)",
    ui: "var(--font-inter)",
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
