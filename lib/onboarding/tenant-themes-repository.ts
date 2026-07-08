import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { DEFAULT_TENANT_THEME } from "@/lib/theme/default-theme";
import { normalizeTenantId } from "@/lib/onboarding/tenant-id";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export type TenantThemeInsert = {
  tenantId: string;
  companyName: string;
  ownerEmail: string;
  ownerUserId: string;
  primaryColor: string;
  logoUrl: string | null;
};

/** Read-only availability check against `public.tenant_themes`. */
export async function isTenantIdAvailable(tenantId: string): Promise<boolean> {
  const normalized = normalizeTenantId(tenantId);
  if (!normalized) return false;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("tenant_themes")
      .select("tenant_id")
      .eq("tenant_id", normalized)
      .maybeSingle();

    if (error) {
      if (/tenant_themes|does not exist|42P01|PGRST205/i.test(error.message)) {
        return true;
      }
      return false;
    }

    return !data;
  } catch {
    return false;
  }
}

/** Insert a tenant branding row — onboarding API only. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSchemaCacheColumnError(message: string): boolean {
  return /schema cache|could not find the '([^']+)' column/i.test(message);
}

function extractMissingColumn(message: string): string | null {
  const match = message.match(/could not find the '([^']+)' column/i);
  return match?.[1] ?? null;
}

const COLUMN_TO_THEME_KEY: Record<string, string> = {
  company_name: "companyName",
  owner_email: "ownerEmail",
  owner_user_id: "ownerUserId",
  primary_color: "primaryColor",
  logo_url: "logoUrl",
  app_name: "appName",
  tagline: "tagline",
  tier: "tier",
};

async function insertTenantRowWithFallback(
  row: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = getSupabaseAdmin();
  let current: Record<string, unknown> = { ...row };
  const themeOverflow: Record<string, unknown> = isRecord(current.theme)
    ? { ...(current.theme as Record<string, unknown>) }
    : {};

  for (let attempt = 0; attempt < 16; attempt += 1) {
    const { error } = await supabase.from("tenant_themes").insert(current);
    if (!error) {
      return { ok: true };
    }

    if (error.code === "23505") {
      return { ok: false, message: "That subdomain is already registered." };
    }

    if (!isSchemaCacheColumnError(error.message)) {
      return { ok: false, message: error.message || "Unable to save tenant settings." };
    }

    const missingColumn = extractMissingColumn(error.message);
    if (!missingColumn || !(missingColumn in current)) {
      return {
        ok: false,
        message:
          "Tenant theme schema is out of date. Run `npm run db:migrate -- supabase/migrations/20260722140000_tenant_themes_full_schema.sql` then `npm run db:schema:reload`.",
      };
    }

    const removedValue = current[missingColumn];
    delete current[missingColumn];

    const themeKey = COLUMN_TO_THEME_KEY[missingColumn];
    if (themeKey && removedValue !== undefined) {
      themeOverflow[themeKey] = removedValue;
    }

    current.theme = themeOverflow;
  }

  return {
    ok: false,
    message:
      "Tenant theme schema is out of date. Run `npm run db:migrate -- supabase/migrations/20260722140000_tenant_themes_full_schema.sql` then `npm run db:schema:reload`.",
  };
}

export async function insertTenantThemeRow(
  payload: TenantThemeInsert,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const tenantId = normalizeTenantId(payload.tenantId);
  const companyName = payload.companyName.trim();
  const ownerEmail = payload.ownerEmail.trim().toLowerCase();
  const primaryColor = payload.primaryColor.trim();

  const colors = {
    primary: primaryColor,
    secondary: DEFAULT_TENANT_THEME.colors.secondary,
    background: DEFAULT_TENANT_THEME.colors.background,
    surface: DEFAULT_TENANT_THEME.colors.surface,
    text: DEFAULT_TENANT_THEME.colors.text,
    textMuted: DEFAULT_TENANT_THEME.colors.textMuted,
    accent: primaryColor,
    border: DEFAULT_TENANT_THEME.colors.border,
  };

  const contact = {
    email: ownerEmail,
    website: "",
    mailSubjectPrefix: `Contact from ${companyName}`,
  };

  const themeDocument: Record<string, unknown> = {
    appName: companyName,
    companyName,
    ownerEmail,
    ownerUserId: payload.ownerUserId,
    tagline: DEFAULT_TENANT_THEME.tagline,
    logoUrl: payload.logoUrl,
    primaryColor,
    tier: "starter",
    colors,
    contact,
    features: DEFAULT_TENANT_THEME.features,
    fonts: DEFAULT_TENANT_THEME.fonts,
    layout: DEFAULT_TENANT_THEME.layout,
    socialLinks: [],
  };

  const insertRow: Record<string, unknown> = {
    tenant_id: tenantId,
    company_name: companyName,
    owner_email: ownerEmail,
    owner_user_id: payload.ownerUserId,
    primary_color: primaryColor,
    tier: "starter",
    logo_url: payload.logoUrl,
    colors,
    contact,
    features: DEFAULT_TENANT_THEME.features,
    fonts: DEFAULT_TENANT_THEME.fonts,
    layout: DEFAULT_TENANT_THEME.layout,
    social_links: [],
    theme: themeDocument,
    updated_at: new Date().toISOString(),
  };

  return insertTenantRowWithFallback(insertRow);
}

export async function uploadTenantLogo(
  tenantId: string,
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const normalized = normalizeTenantId(tenantId);
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const safeExtension = ["png", "jpg", "jpeg", "webp", "svg"].includes(extension)
    ? extension
    : "png";
  const objectPath = `${normalized}/logo.${safeExtension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from("tenant-assets").upload(objectPath, bytes, {
    upsert: true,
    contentType: file.type || `image/${safeExtension === "svg" ? "svg+xml" : safeExtension}`,
    cacheControl: "3600",
  });

  if (error) {
    return { ok: false, message: error.message || "Logo upload failed." };
  }

  const { data } = supabase.storage.from("tenant-assets").getPublicUrl(objectPath);
  if (!data.publicUrl) {
    return { ok: false, message: "Unable to resolve logo URL." };
  }

  return { ok: true, url: data.publicUrl };
}

/** Register business owner via Supabase Auth admin API — no viewer auth helpers. */
function isDuplicateEmailError(message: string): boolean {
  return /already been registered|already exists|duplicate/i.test(message);
}

async function verifyTenantOwnerPassword(
  email: string,
  password: string,
): Promise<{ ok: true; userId: string } | { ok: false; message: string }> {
  const verifier = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await verifier.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user?.id) {
    return {
      ok: false,
      message:
        "This email is already registered. Sign in with your existing password, or use a different administrative email.",
    };
  }

  return { ok: true, userId: data.user.id };
}

export async function registerTenantOwnerAccount(
  email: string,
  password: string,
  metadata: Record<string, string>,
): Promise<{ ok: true; userId: string } | { ok: false; message: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await getSupabaseAdmin().auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: {
      account_type: "tenant_owner",
      ...metadata,
    },
  });

  if (!error && data.user?.id) {
    return { ok: true, userId: data.user.id };
  }

  if (error && isDuplicateEmailError(error.message)) {
    const passwordCheck = await verifyTenantOwnerPassword(normalizedEmail, password);
    if (passwordCheck.ok === false) {
      return passwordCheck;
    }

    await getSupabaseAdmin().auth.admin.updateUserById(passwordCheck.userId, {
      user_metadata: {
        account_type: "tenant_owner",
        ...metadata,
      },
    });

    return { ok: true, userId: passwordCheck.userId };
  }

  return { ok: false, message: error?.message || "Unable to create owner account." };
}
