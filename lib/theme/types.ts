/** White-label theme contract — all UI surfaces read from this shape. */

export type ThemeNavStyle = "bottom" | "sidebar";

export type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  accent: string;
  border: string;
};

export type ThemeFonts = {
  headline: string;
  body: string;
  ui: string;
};

export type ThemeLayout = {
  navStyle: ThemeNavStyle;
  showFooter: boolean;
  footerText: string;
};

export type ThemeFeatureFlags = {
  showMusic: boolean;
  showGiving: boolean;
  showBuySeeds: boolean;
  showPrayer: boolean;
  showStory: boolean;
  showLive: boolean;
};

export type ThemeContact = {
  email: string;
  website: string;
  mailSubjectPrefix: string;
};

export type ThemeSocialLink = {
  id: string;
  label: string;
  href: string;
};

export type TenantTheme = {
  appName: string;
  tagline: string;
  logoUrl: string | null;
  logoUrlDark: string | null;
  faviconUrl: string | null;
  heroImageUrl: string | null;
  contact: ThemeContact;
  socialLinks: readonly ThemeSocialLink[];
  colors: ThemeColors;
  fonts: ThemeFonts;
  layout: ThemeLayout;
  features: ThemeFeatureFlags;
};

export type DashboardAction = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
};
