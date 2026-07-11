export { DEFAULT_TENANT_THEME } from "@/lib/theme/default-theme";
export { PLATFORM_APP_NAME, PLATFORM_SHORT_NAME, PLATFORM_TAGLINE, PLATFORM_SECONDARY_MARK } from "@/lib/theme/brand";
export {
  FAITH_BRAND_COLORS,
  FAITH_BRAND_FULL_NAME,
  FAITH_BRAND_HERO_GRADIENT,
  FAITH_BRAND_MESSAGING,
  FAITH_BRAND_WORDMARK,
  faithBrandCssVariables,
  faithGoldRgb,
} from "@/lib/theme/faith-brand-guidelines";
export { applyThemeToElement, themeToCssVariables } from "@/lib/theme/apply-theme-vars";
export {
  resolveEffectiveTenantTheme,
  resolveAndApplyThemeToElement,
} from "@/lib/theme/resolve-effective-theme";
export type {
  ResolvedTenantTheme,
  ThemeResolutionSource,
} from "@/lib/theme/resolve-effective-theme";
export {
  getEnterpriseThemeOverride,
  isEnterpriseThemeLocked,
  getActiveWorkspaceId,
} from "@/lib/theme/enterprise/workspace-overrides";
export { mergeTenantTheme, hasCustomThemeOverrides } from "@/lib/theme/merge-theme";
export type { TenantThemePatch } from "@/lib/theme/merge-theme";
export {
  loadStoredTenantTheme,
  saveStoredTenantTheme,
  clearStoredTenantTheme,
  TENANT_THEME_STORAGE_KEY,
} from "@/lib/theme/theme-storage";
export { parseTenantThemePayload, serializeTenantTheme } from "@/lib/theme/parse-theme-payload";
export {
  getServerTenantTheme,
  setServerTenantThemePayload,
  clearServerTenantTheme,
} from "@/lib/theme/theme-server-store";
export { getTenantTheme, defaultTheme } from "@/lib/theme/tenant-resolver";
export type {
  DashboardAction,
  TenantTheme,
  ThemeColors,
  ThemeContact,
  ThemeFeatureFlags,
  ThemeFonts,
  ThemeLayout,
  ThemeNavStyle,
  ThemeSocialLink,
} from "@/lib/theme/types";
