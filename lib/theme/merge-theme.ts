import { DEFAULT_TENANT_THEME } from "@/lib/theme/default-theme";
import type {
  TenantTheme,
  ThemeColors,
  ThemeContact,
  ThemeFeatureFlags,
  ThemeFonts,
  ThemeLayout,
  ThemeSocialLink,
} from "@/lib/theme/types";

export type TenantThemePatch = {
  appName?: string;
  tagline?: string;
  logoUrl?: string | null;
  logoUrlDark?: string | null;
  faviconUrl?: string | null;
  heroImageUrl?: string | null;
  contact?: Partial<ThemeContact>;
  socialLinks?: readonly ThemeSocialLink[];
  colors?: Partial<ThemeColors>;
  fonts?: Partial<ThemeFonts>;
  layout?: Partial<ThemeLayout>;
  features?: Partial<ThemeFeatureFlags>;
};

/** Deep-merge a partial theme onto defaults — unset fields keep neutral fallbacks. */
export function mergeTenantTheme(
  base: TenantTheme = DEFAULT_TENANT_THEME,
  patch?: TenantThemePatch | null,
): TenantTheme {
  if (!patch) return base;

  return {
    appName: patch.appName ?? base.appName,
    tagline: patch.tagline ?? base.tagline,
    logoUrl: patch.logoUrl !== undefined ? patch.logoUrl : base.logoUrl,
    logoUrlDark: patch.logoUrlDark !== undefined ? patch.logoUrlDark : base.logoUrlDark,
    faviconUrl: patch.faviconUrl !== undefined ? patch.faviconUrl : base.faviconUrl,
    heroImageUrl: patch.heroImageUrl !== undefined ? patch.heroImageUrl : base.heroImageUrl,
    contact: { ...base.contact, ...patch.contact },
    socialLinks: patch.socialLinks ?? base.socialLinks,
    colors: { ...base.colors, ...patch.colors },
    fonts: { ...base.fonts, ...patch.fonts },
    layout: { ...base.layout, ...patch.layout },
    features: { ...base.features, ...patch.features },
  };
}

/** True when patch overrides any field from the default theme. */
export function hasCustomThemeOverrides(theme: TenantTheme): boolean {
  const defaults = DEFAULT_TENANT_THEME;
  return JSON.stringify(theme) !== JSON.stringify(defaults);
}
