import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export type OwnerAuthResult =
  | { ok: true; userId: string; resumed?: boolean }
  | { ok: false; message: string; code?: "email_exists" | "invalid_credentials" };

export function isDuplicateEmailError(message: string): boolean {
  return /already been registered|already exists|duplicate/i.test(message);
}

/** Verify owner email/password against Supabase Auth (no session persisted). */
export async function verifyOwnerCredentials(
  email: string,
  password: string,
): Promise<{ ok: true; userId: string } | { ok: false; message: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error || !data.user?.id) {
    return {
      ok: false,
      message: "That email is already registered. Sign in with your existing password to continue.",
    };
  }

  return { ok: true, userId: data.user.id };
}

export async function findTenantIdByOwnerEmail(email: string): Promise<string | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await getSupabaseAdmin()
    .from("tenant_themes")
    .select("tenant_id")
    .eq("owner_email", normalizedEmail)
    .maybeSingle();

  if (error || !data?.tenant_id) return null;
  return String(data.tenant_id);
}

/** Create owner account, or resume an existing auth user when credentials match. */
export async function registerOrResumeTenantOwner(
  email: string,
  password: string,
  metadata: Record<string, string>,
): Promise<OwnerAuthResult> {
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

  if (!error || !isDuplicateEmailError(error.message)) {
    return { ok: false, message: error?.message || "Unable to create owner account." };
  }

  const verified = await verifyOwnerCredentials(normalizedEmail, password);
  if (verified.ok === false) {
    return {
      ok: false,
      code: "email_exists",
      message: verified.message,
    };
  }

  const existingTenantId = await findTenantIdByOwnerEmail(normalizedEmail);
  if (existingTenantId) {
    await getSupabaseAdmin().auth.admin.updateUserById(verified.userId, {
      user_metadata: {
        account_type: "tenant_owner",
        ...metadata,
      },
    });
  }

  return { ok: true, userId: verified.userId, resumed: true };
}
