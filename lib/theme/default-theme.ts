import type { TenantTheme } from "@/lib/theme/types";

/** Premium PΛRΛBLE OS faith infrastructure fallback — used when no tenant row resolves. */
export const DEFAULT_TENANT_THEME: TenantTheme = {
  appName: "PΛRΛBLE OS // FAITH INFRASTRUCTURE",
  tagline: "Own Your Sanctuary. Own Your Stream. Own Your Ministry.",
  logoUrl: "/tenant-default/dashboard/flagship-logo.png",
  logoUrlDark: "/tenant-default/dashboard/flagship-logo.png",
  faviconUrl: null,
  heroImageUrl: null,
  contact: {
    email: "sanctuary@parableos.faith",
    website: "https://parableos.faith",
    mailSubjectPrefix: "Contact from PΛRΛBLE OS // FAITH INFRASTRUCTURE",
  },
  socialLinks: [],
  colors: {
    primary: "#FFB800",
    secondary: "#7A00FF",
    background: "#000000",
    surface: "#000000",
    text: "#ffffff",
    textMuted: "#a3a3a3",
    accent: "#7A00FF",
    border: "rgba(122, 0, 255, 0.28)",
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
