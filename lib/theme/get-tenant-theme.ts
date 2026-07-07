import { getSupabaseAdmin } from "@/lib/supabase/server";
import { DEFAULT_TENANT_THEME } from "@/lib/theme/default-theme";
import { mergeTenantTheme, type TenantThemePatch } from "@/lib/theme/merge-theme";
import type {
  TenantTheme,
  ThemeColors,
  ThemeContact,
  ThemeFeatureFlags,
  ThemeFonts,
  ThemeLayout,
  ThemeNavStyle,
  ThemeSocialLink,
} from "@/lib/theme/types";

type TenantThemeRow = {
  tenant_id: string;
  app_name?: string | null;
  tagline?: string | null;
  logo_url?: string | null;
  logo_url_dark?: string | null;
  favicon_url?: string | null;
  hero_image_url?: string | null;
  primary_color?: string | null;
  contact?: unknown;
  social_links?: unknown;
  colors?: unknown;
  fonts?: unknown;
  layout?: unknown;
  features?: unknown;
  theme?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function readNullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return readString(value);
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function mapContact(value: unknown): Partial<ThemeContact> | undefined {
  if (!isRecord(value)) return undefined;
  const email = readString(value.email);
  const website = readString(value.website);
  const mailSubjectPrefix =
    readString(value.mailSubjectPrefix) ?? readString(value.mail_subject_prefix);
  if (!email && !website && !mailSubjectPrefix) return undefined;
  return { email, website, mailSubjectPrefix };
}

function mapColors(value: unknown): Partial<ThemeColors> | undefined {
  if (!isRecord(value)) return undefined;
  const colors: Partial<ThemeColors> = {
    primary: readString(value.primary),
    secondary: readString(value.secondary),
    background: readString(value.background),
    surface: readString(value.surface),
    text: readString(value.text),
    textMuted: readString(value.textMuted) ?? readString(value.text_muted),
    accent: readString(value.accent),
    border: readString(value.border),
  };
  return Object.values(colors).some((entry) => entry !== undefined) ? colors : undefined;
}

function mapFonts(value: unknown): Partial<ThemeFonts> | undefined {
  if (!isRecord(value)) return undefined;
  const fonts: Partial<ThemeFonts> = {
    headline: readString(value.headline),
    body: readString(value.body),
    ui: readString(value.ui),
  };
  return Object.values(fonts).some((entry) => entry !== undefined) ? fonts : undefined;
}

function mapLayout(value: unknown): Partial<ThemeLayout> | undefined {
  if (!isRecord(value)) return undefined;
  const navStyleRaw = readString(value.navStyle) ?? readString(value.nav_style);
  const navStyle: ThemeNavStyle | undefined =
    navStyleRaw === "bottom" || navStyleRaw === "sidebar" ? navStyleRaw : undefined;
  const showFooter = readBoolean(value.showFooter) ?? readBoolean(value.show_footer);
  const footerText = readString(value.footerText) ?? readString(value.footer_text);
  if (navStyle === undefined && showFooter === undefined && !footerText) return undefined;
  return { navStyle, showFooter, footerText };
}

function mapFeatures(value: unknown): Partial<ThemeFeatureFlags> | undefined {
  if (!isRecord(value)) return undefined;
  const features: Partial<ThemeFeatureFlags> = {
    showMusic: readBoolean(value.showMusic) ?? readBoolean(value.show_music),
    showGiving: readBoolean(value.showGiving) ?? readBoolean(value.show_giving),
    showBuySeeds: readBoolean(value.showBuySeeds) ?? readBoolean(value.show_buy_seeds),
    showPrayer: readBoolean(value.showPrayer) ?? readBoolean(value.show_prayer),
    showStory: readBoolean(value.showStory) ?? readBoolean(value.show_story),
    showLive: readBoolean(value.showLive) ?? readBoolean(value.show_live),
  };
  return Object.values(features).some((entry) => entry !== undefined) ? features : undefined;
}

function mapSocialLinks(value: unknown): readonly ThemeSocialLink[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const links: ThemeSocialLink[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const id = readString(entry.id);
    const label = readString(entry.label);
    const href = readString(entry.href);
    if (!id || !label || !href) continue;
    links.push({ id, label, href });
  }
  return links.length > 0 ? links : undefined;
}

function mapTenantThemeRow(row: TenantThemeRow): TenantTheme {
  const embeddedTheme = isRecord(row.theme) ? row.theme : null;
  const patch: TenantThemePatch = {
    appName:
      readString(row.app_name) ??
      (embeddedTheme ? readString(embeddedTheme.appName) ?? readString(embeddedTheme.app_name) : undefined),
    tagline: readString(row.tagline) ?? (embeddedTheme ? readString(embeddedTheme.tagline) : undefined),
    logoUrl:
      readNullableString(row.logo_url) ??
      (embeddedTheme
        ? readNullableString(embeddedTheme.logoUrl) ?? readNullableString(embeddedTheme.logo_url)
        : undefined),
    logoUrlDark:
      readNullableString(row.logo_url_dark) ??
      (embeddedTheme
        ? readNullableString(embeddedTheme.logoUrlDark) ??
          readNullableString(embeddedTheme.logo_url_dark)
        : undefined),
    faviconUrl:
      readNullableString(row.favicon_url) ??
      (embeddedTheme
        ? readNullableString(embeddedTheme.faviconUrl) ??
          readNullableString(embeddedTheme.favicon_url)
        : undefined),
    heroImageUrl:
      readNullableString(row.hero_image_url) ??
      (embeddedTheme
        ? readNullableString(embeddedTheme.heroImageUrl) ??
          readNullableString(embeddedTheme.hero_image_url)
        : undefined),
    contact: mapContact(row.contact) ?? (embeddedTheme ? mapContact(embeddedTheme.contact) : undefined),
    socialLinks:
      mapSocialLinks(row.social_links) ??
      (embeddedTheme ? mapSocialLinks(embeddedTheme.socialLinks ?? embeddedTheme.social_links) : undefined),
    colors:
      mapColors(row.colors) ??
      (embeddedTheme ? mapColors(embeddedTheme.colors) : undefined) ??
      (readString(row.primary_color)
        ? { primary: readString(row.primary_color) }
        : undefined),
    fonts: mapFonts(row.fonts) ?? (embeddedTheme ? mapFonts(embeddedTheme.fonts) : undefined),
    layout: mapLayout(row.layout) ?? (embeddedTheme ? mapLayout(embeddedTheme.layout) : undefined),
    features:
      mapFeatures(row.features) ?? (embeddedTheme ? mapFeatures(embeddedTheme.features) : undefined),
  };
  return mergeTenantTheme(DEFAULT_TENANT_THEME, patch);
}

function hasSupabaseAdminCredentials(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(url && serviceRoleKey && !serviceRoleKey.includes("yourActual"));
}

/** Read-only tenant branding lookup — falls back to DEFAULT_TENANT_THEME on any failure. */
export async function getTenantTheme(tenantId: string): Promise<TenantTheme> {
  const normalizedTenantId = tenantId.trim().toLowerCase();
  if (!normalizedTenantId || !hasSupabaseAdminCredentials()) {
    return DEFAULT_TENANT_THEME;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("tenant_themes")
      .select("*")
      .eq("tenant_id", normalizedTenantId)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_TENANT_THEME;
    }

    return mapTenantThemeRow(data as TenantThemeRow);
  } catch {
    return DEFAULT_TENANT_THEME;
  }
}
