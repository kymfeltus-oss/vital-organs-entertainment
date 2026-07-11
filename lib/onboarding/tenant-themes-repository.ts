import { getSupabaseAdmin } from "@/lib/supabase/server";
import { registerOrResumeTenantOwner } from "@/lib/onboarding/owner-auth";
import { DEFAULT_TENANT_THEME } from "@/lib/theme/default-theme";
import { normalizeTenantId } from "@/lib/onboarding/tenant-id";
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
export async function insertTenantThemeRow(
  payload: TenantThemeInsert,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const tenantId = normalizeTenantId(payload.tenantId);
  const companyName = payload.companyName.trim();
  const ownerEmail = payload.ownerEmail.trim().toLowerCase();
  const primaryColor = payload.primaryColor.trim();

  const { error } = await getSupabaseAdmin().from("tenant_themes").insert({
    tenant_id: tenantId,
    company_name: companyName,
    owner_email: ownerEmail,
    owner_user_id: payload.ownerUserId,
    app_name: companyName,
    tier: "starter",
    tagline: DEFAULT_TENANT_THEME.tagline,
    logo_url: payload.logoUrl,
    primary_color: primaryColor,
    colors: {
      primary: primaryColor,
      secondary: DEFAULT_TENANT_THEME.colors.secondary,
      background: DEFAULT_TENANT_THEME.colors.background,
      surface: DEFAULT_TENANT_THEME.colors.surface,
      text: DEFAULT_TENANT_THEME.colors.text,
      textMuted: DEFAULT_TENANT_THEME.colors.textMuted,
      accent: primaryColor,
      border: DEFAULT_TENANT_THEME.colors.border,
    },
    contact: {
      email: ownerEmail,
      website: "",
      mailSubjectPrefix: `Contact from ${companyName}`,
    },
    features: DEFAULT_TENANT_THEME.features,
    fonts: DEFAULT_TENANT_THEME.fonts,
    layout: DEFAULT_TENANT_THEME.layout,
    social_links: [],
    updated_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "That subdomain is already registered." };
    }
    return { ok: false, message: error.message || "Unable to save tenant settings." };
  }

  return { ok: true };
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

/** Register business owner — creates account or resumes when email already exists. */
export async function registerTenantOwnerAccount(
  email: string,
  password: string,
  metadata: Record<string, string>,
) {
  return registerOrResumeTenantOwner(email, password, metadata);
}
