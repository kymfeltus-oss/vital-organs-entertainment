import type { TenantTheme } from "@/lib/theme/types";

/** Flagship PΛRΛBLE STREAMING demo fallback — used when no tenant row resolves. */
export const DEFAULT_TENANT_THEME: TenantTheme = {
  appName: "PΛRΛBLE STREAMING",
  tagline: "Own Your Stream. Own Your Brand. Own Your Revenue.",
  logoUrl: "/tenant-default/dashboard/flagship-logo.png",
  logoUrlDark: "/tenant-default/dashboard/flagship-logo.png",
  faviconUrl: null,
  heroImageUrl: null,
  contact: {
    email: "ops@parablestream.com",
    website: "https://parablestream.com",
    mailSubjectPrefix: "Contact from PΛRΛBLE STREAMING",
  },
  socialLinks: [],
  colors: {
    primary: "#00C2FF",
    secondary: "#6C4DFF",
    background: "#000000",
    surface: "#000000",
    text: "#ffffff",
    textMuted: "#a3a3a3",
    accent: "#6C4DFF",
    border: "rgba(108, 77, 255, 0.28)",
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

export const defaultTheme = DEFAULT_TENANT_THEME;
