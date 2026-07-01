import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";
import { isE2EBypassEnabled } from "@/lib/access/e2e-bypass";
import { isAdminPrepAccessOverrideEmail } from "@/lib/access/admin-prep-override";

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
      email: process.env.E2E_ADMIN_EMAIL?.trim().toLowerCase() || "info@vitalorgansent.com",
    };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    return { ok: false, status: 401, message: "Sign in required." };
  }

  const email = user.email?.trim().toLowerCase() ?? "";
  if (!email || !isAdminPrepAccessOverrideEmail(email)) {
    return { ok: false, status: 403, message: "Owner access is not authorized for this account." };
  }

  return { ok: true, userId: user.id, email };
}
