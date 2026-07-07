import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";
import { isE2EBypassEnabled } from "@/lib/access/e2e-bypass";
import { isAdminPrepAccessOverrideEmail } from "@/lib/access/admin-prep-override";
import { DEFAULT_TENANT_THEME } from "@/lib/theme/default-theme";

export type OwnerAuthSuccess = {
  ok: true;
  userId: string;
  email: string;
};

export type OwnerAuthFailure = {
  ok: false;
  status: 401 | 403;
  message: string;
};

export type OwnerAuthResult = OwnerAuthSuccess | OwnerAuthFailure;

/** Server-only — gates /api/owner/* and /owner/* surfaces. */
export async function requireOwnerUser(): Promise<OwnerAuthResult> {
  if (isE2EBypassEnabled()) {
    console.info("⚡ [E2E BYPASS] Injecting synthetic owner session matching core type contracts.");
    return {
      ok: true,
      userId: "e2e-test-synthetic-owner-uuid",
      email: process.env.E2E_ADMIN_EMAIL?.trim().toLowerCase() || DEFAULT_TENANT_THEME.contact.email,
    };
  }

  let user: { id: string; email?: string | null } | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const result = await supabase.auth.getUser();
    if (result.error || !result.data.user?.id) {
      return { ok: false, status: 401, message: "Sign in required." };
    }
    user = result.data.user;
  } catch (authError) {
    console.error("[owner/auth] getUser failed:", authError);
    return { ok: false, status: 401, message: "Sign in required." };
  }

  if (!user?.id) {
    return { ok: false, status: 401, message: "Sign in required." };
  }

  const email = user.email?.trim().toLowerCase() ?? "";
  if (!email || !isAdminPrepAccessOverrideEmail(email)) {
    return { ok: false, status: 403, message: "Owner access is not authorized for this account." };
  }

  return { ok: true, userId: user.id, email };
}
