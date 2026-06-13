import { notFound, redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { inspectOpsAdminAccess } from "@/lib/ops/admin-auth";
import {
  evaluateOpsAuthDecision,
  logOpsAuthDiagnostic,
} from "@/lib/ops/auth-diagnostics";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";

export async function requireOpsAdminUser(returnPath = "/ops") {
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

  if (error || !user) {
    redirect(`/email-gate?next=${encodeURIComponent(returnPath)}`);
  }

  if (!inspection.allowed) {
    notFound();
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
