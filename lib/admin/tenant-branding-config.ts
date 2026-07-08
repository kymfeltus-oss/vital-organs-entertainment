import { getSupabaseAdmin } from "@/lib/supabase/server";
import { DEFAULT_TENANT_THEME } from "@/lib/theme/default-theme";
import { normalizeTenantId } from "@/lib/onboarding/tenant-id";

export type TenantBrandingConfig = {
  tenantId: string;
  ministryName: string;
  customGivingName: string;
  customTokenName: string;
  customEventsName: string;
  customMembersName: string;
  primaryColor: string;
  secondaryColor: string;
  tagline: string;
  accentGlow: string;
};

const DEFAULT_GIVING = "PΛRΛBLE Giving";
const DEFAULT_TOKEN = "Faith Seeds";
const DEFAULT_EVENTS = "Community Gatherings";
const DEFAULT_MEMBERS = "Family Members";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isSchemaCacheColumnError(message: string): boolean {
  return /schema cache|could not find the '([^']+)' column/i.test(message);
}

function extractMissingColumn(message: string): string | null {
  const match = message.match(/could not find the '([^']+)' column/i);
  return match?.[1] ?? null;
}

function mapRowToConfig(tenantId: string, row: Record<string, unknown>): TenantBrandingConfig {
  const embeddedTheme = isRecord(row.theme) ? row.theme : null;
  const colors = isRecord(row.colors) ? row.colors : null;

  const primaryColor =
    readString(row.primary_color) ??
    readString(colors?.primary) ??
    (embeddedTheme && isRecord(embeddedTheme.colors)
      ? readString(embeddedTheme.colors.primary)
      : undefined) ??
    DEFAULT_TENANT_THEME.colors.primary;

  const secondaryColor =
    readString(row.secondary_color) ??
    readString(colors?.secondary) ??
    (embeddedTheme && isRecord(embeddedTheme.colors)
      ? readString(embeddedTheme.colors.secondary)
      : undefined) ??
    DEFAULT_TENANT_THEME.colors.secondary;

  return {
    tenantId,
    ministryName:
      readString(row.app_name) ??
      readString(row.company_name) ??
      (embeddedTheme
        ? readString(embeddedTheme.appName) ?? readString(embeddedTheme.companyName)
        : undefined) ??
      "",
    customGivingName:
      readString(row.custom_giving_title) ??
      (embeddedTheme
        ? readString(embeddedTheme.customGivingTitle) ?? readString(embeddedTheme.supportLabel)
        : undefined) ??
      DEFAULT_GIVING,
    customTokenName:
      readString(row.custom_token_title) ??
      (embeddedTheme
        ? readString(embeddedTheme.customTokenTitle) ?? readString(embeddedTheme.tokenShopLabel)
        : undefined) ??
      DEFAULT_TOKEN,
    customEventsName:
      readString(row.custom_events_title) ??
      (embeddedTheme
        ? readString(embeddedTheme.customEventsTitle) ?? readString(embeddedTheme.browseLabel)
        : undefined) ??
      DEFAULT_EVENTS,
    customMembersName:
      readString(row.custom_members_title) ??
      (embeddedTheme
        ? readString(embeddedTheme.customMembersTitle) ?? readString(embeddedTheme.homeLabel)
        : undefined) ??
      DEFAULT_MEMBERS,
    primaryColor,
    secondaryColor,
    tagline:
      readString(row.tagline) ??
      (embeddedTheme ? readString(embeddedTheme.tagline) : undefined) ??
      DEFAULT_TENANT_THEME.tagline,
    accentGlow:
      readString(row.accent_glow) ??
      (embeddedTheme ? readString(embeddedTheme.accentGlow) : undefined) ??
      `${primaryColor}80`,
  };
}

export async function loadTenantBrandingConfig(
  tenantId: string,
): Promise<TenantBrandingConfig | null> {
  const normalized = normalizeTenantId(tenantId);
  if (!normalized) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tenant_themes")
    .select("*")
    .eq("tenant_id", normalized)
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToConfig(normalized, data as Record<string, unknown>);
}

async function updateWithFallback(
  tenantId: string,
  patch: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = getSupabaseAdmin();
  let current: Record<string, unknown> = { ...patch };
  const themeOverflow: Record<string, unknown> = isRecord(current.theme)
    ? { ...(current.theme as Record<string, unknown>) }
    : {};

  for (let attempt = 0; attempt < 16; attempt += 1) {
    const { error } = await supabase
      .from("tenant_themes")
      .update(current)
      .eq("tenant_id", tenantId);

    if (!error) return { ok: true };

    if (!isSchemaCacheColumnError(error.message)) {
      return { ok: false, message: error.message || "Unable to save branding configuration." };
    }

    const missingColumn = extractMissingColumn(error.message);
    if (!missingColumn || !(missingColumn in current)) {
      return {
        ok: false,
        message:
          "Tenant vocabulary schema is out of date. Run `npm run db:migrate -- supabase/migrations/20260707180000_tenant_themes_vocabulary_columns.sql` then `npm run db:schema:reload`.",
      };
    }

    const removedValue = current[missingColumn];
    delete current[missingColumn];

    if (removedValue !== undefined) {
      const camelKey = missingColumn.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
      themeOverflow[camelKey] = removedValue;
    }

    current.theme = themeOverflow;
  }

  return {
    ok: false,
    message:
      "Tenant vocabulary schema is out of date. Run `npm run db:migrate -- supabase/migrations/20260707180000_tenant_themes_vocabulary_columns.sql` then `npm run db:schema:reload`.",
  };
}

export async function saveTenantBrandingConfig(
  config: TenantBrandingConfig,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const tenantId = normalizeTenantId(config.tenantId);
  if (!tenantId) {
    return { ok: false, message: "Invalid tenant identifier." };
  }

  const ministryName = config.ministryName.trim();
  const customGivingName = config.customGivingName.trim() || DEFAULT_GIVING;
  const customTokenName = config.customTokenName.trim() || DEFAULT_TOKEN;
  const customEventsName = config.customEventsName.trim() || DEFAULT_EVENTS;
  const customMembersName = config.customMembersName.trim() || DEFAULT_MEMBERS;
  const primaryColor = config.primaryColor.trim() || DEFAULT_TENANT_THEME.colors.primary;
  const secondaryColor = config.secondaryColor.trim() || DEFAULT_TENANT_THEME.colors.secondary;
  const tagline = config.tagline.trim() || DEFAULT_TENANT_THEME.tagline;
  const accentGlow = config.accentGlow.trim() || `${primaryColor}80`;

  const colors = {
    primary: primaryColor,
    secondary: secondaryColor,
    background: DEFAULT_TENANT_THEME.colors.background,
    surface: DEFAULT_TENANT_THEME.colors.surface,
    text: DEFAULT_TENANT_THEME.colors.text,
    textMuted: DEFAULT_TENANT_THEME.colors.textMuted,
    accent: secondaryColor,
    border: DEFAULT_TENANT_THEME.colors.border,
  };

  const themeDocument: Record<string, unknown> = {
    appName: ministryName,
    companyName: ministryName,
    tagline,
    customGivingTitle: customGivingName,
    customTokenTitle: customTokenName,
    customEventsTitle: customEventsName,
    customMembersTitle: customMembersName,
    supportLabel: customGivingName,
    tokenShopLabel: customTokenName,
    browseLabel: customEventsName,
    homeLabel: customMembersName,
    primaryColor,
    secondaryColor,
    accentGlow,
    colors,
  };

  const patch: Record<string, unknown> = {
    app_name: ministryName,
    company_name: ministryName,
    custom_giving_title: customGivingName,
    custom_token_title: customTokenName,
    custom_events_title: customEventsName,
    custom_members_title: customMembersName,
    primary_color: primaryColor,
    secondary_color: secondaryColor,
    tagline,
    accent_glow: accentGlow,
    colors,
    theme: themeDocument,
    updated_at: new Date().toISOString(),
  };

  return updateWithFallback(tenantId, patch);
}
