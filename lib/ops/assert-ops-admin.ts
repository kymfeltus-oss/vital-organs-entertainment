import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { buildTeamGateUrl } from "@/lib/auth/routing";
import { inspectOpsAdminAccess } from "@/lib/ops/admin-auth";
import {
  evaluateOpsAuthDecision,
  logOpsAuthDiagnostic,
} from "@/lib/ops/auth-diagnostics";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";

async function resolveOpsAdminGateUser(supabase: SupabaseClient): Promise<{
  user: User | null;
  error: Error | null;
}> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: error ?? null };
  }

  if (inspectOpsAdminAccess(user).allowed) {
    return { user, error: null };
  }

  const { data: refreshData, error: refreshError } =
    await supabase.auth.refreshSession();

  if (!refreshError && refreshData.user && inspectOpsAdminAccess(refreshData.user).allowed) {
    return { user: refreshData.user, error: null };
  }

  return { user, error: null };
}

export async function requireOpsAdminUser(returnPath = "/ops") {
  const supabase = await createServerSupabaseClient();
  const { user, error } = await resolveOpsAdminGateUser(supabase);

  const inspection = inspectOpsAdminAccess(user);

  logOpsAuthDiagnostic(
    evaluateOpsAuthDecision({
      hasAuthError: Boolean(error),
      hasUser: Boolean(user),
      normalizedEmail: inspection.normalizedEmail,
      allowlistCount: inspection.allowlistCount,
      allowlistMatch: inspection.allowlistMatch,
      metadataOpsAdmin: inspection.metadataOpsAdmin,
      devBypassActive: inspection.devBypassActive,
    }),
  );

  if (error || !user || !inspection.allowed) {
    redirect(buildTeamGateUrl(returnPath));
  }

  return user;
}

export async function requireOpsAdminApiUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const inspection = inspectOpsAdminAccess(user);

  logOpsAuthDiagnostic(
    evaluateOpsAuthDecision({
      hasAuthError: Boolean(error),
      hasUser: Boolean(user),
      normalizedEmail: inspection.normalizedEmail,
      allowlistCount: inspection.allowlistCount,
      allowlistMatch: inspection.allowlistMatch,
      metadataOpsAdmin: inspection.metadataOpsAdmin,
      devBypassActive: inspection.devBypassActive,
    }),
  );

  if (error || !inspection.allowed) {
    return {
      user: null,
      response: NextResponse.json({ error: "Not found." }, { status: 404 }),
    };
  }

  return { user, response: null };
}
