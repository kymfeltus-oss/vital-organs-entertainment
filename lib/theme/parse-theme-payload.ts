import type {
  TenantTheme,
  ThemeColors,
  ThemeContact,
  ThemeFeatureFlags,
  ThemeSocialLink,
} from "@/lib/theme/types";
import type { TenantThemePatch } from "@/lib/theme/merge-theme";

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

function parseContact(value: unknown): Partial<ThemeContact> | undefined {
  if (!isRecord(value)) return undefined;
  const email = readString(value.email);
  const website = readString(value.website);
  const mailSubjectPrefix = readString(value.mailSubjectPrefix);
  if (!email && !website && !mailSubjectPrefix) return undefined;
  return { email, website, mailSubjectPrefix };
}

function parseColors(value: unknown): Partial<ThemeColors> | undefined {
  if (!isRecord(value)) return undefined;
  const keys = [
    "primary",
    "secondary",
    "background",
    "surface",
    "text",
    "textMuted",
    "accent",
    "border",
  ] as const;
  const colors: Partial<ThemeColors> = {};
  for (const key of keys) {
    const v = readString(value[key]);
    if (v) colors[key] = v;
  }
  return Object.keys(colors).length > 0 ? colors : undefined;
}

function parseFeatures(value: unknown): Partial<ThemeFeatureFlags> | undefined {
  if (!isRecord(value)) return undefined;
  const keys = [
    "showMusic",
    "showGiving",
    "showBuySeeds",
    "showPrayer",
    "showStory",
    "showLive",
  ] as const;
  const features: Partial<ThemeFeatureFlags> = {};
  for (const key of keys) {
    const v = readBoolean(value[key]);
    if (v !== undefined) features[key] = v;
  }
  return Object.keys(features).length > 0 ? features : undefined;
}

function parseSocialLinks(value: unknown): readonly ThemeSocialLink[] | undefined {
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
  return links;
}

/** Validates and normalizes unknown JSON into a partial tenant theme patch. */
export function parseTenantThemePayload(value: unknown): TenantThemePatch | null {
  if (!isRecord(value)) return null;

  const patch: TenantThemePatch = {
    appName: readString(value.appName),
    tagline: readString(value.tagline),
    logoUrl: readNullableString(value.logoUrl),
    logoUrlDark: readNullableString(value.logoUrlDark),
    faviconUrl: readNullableString(value.faviconUrl),
    heroImageUrl: readNullableString(value.heroImageUrl),
    contact: parseContact(value.contact),
    colors: parseColors(value.colors),
    features: parseFeatures(value.features),
    socialLinks: parseSocialLinks(value.socialLinks),
  };

  const hasValue = Object.entries(patch).some(([, v]) => v !== undefined);
  return hasValue ? patch : null;
}

/** Full theme payload for API responses. */
export function serializeTenantTheme(theme: TenantTheme): TenantTheme {
  return theme;
}
