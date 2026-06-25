import type { User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { inspectOpsAdminAccess } from "@/lib/ops/admin-auth";
import {
  getCrewRoleFromRequest,
  isOpsRoleCheckBypassed,
} from "@/lib/ops/crew-role-auth";
import { canAccessModule } from "@/lib/ops/team-roles";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";
import { buildIncidentPermissions, mapOpsRoleToIncidentRole } from "@/lib/incidents/rbac";
import type { IncidentPermissions } from "@/lib/incidents/types";

export type IncidentAuthContext = {
  user: User;
  permissions: IncidentPermissions;
};

export async function requireIncidentApiUser(
  request?: NextRequest,
): Promise<{ context: IncidentAuthContext | null; response: NextResponse | null }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      context: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const inspection = inspectOpsAdminAccess(user);
  const { role } = await getCrewRoleFromRequest(request);
  const isOpsAdmin = inspection.allowed || isOpsRoleCheckBypassed(user);

  if (!isOpsAdmin && !canAccessModule(role, "incident")) {
    return {
      context: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const incidentRole = mapOpsRoleToIncidentRole(role, isOpsAdmin);
  const permissions = buildIncidentPermissions(incidentRole);

  return {
    context: { user, permissions },
    response: null,
  };
}

export function incidentForbiddenResponse(action: string): NextResponse {
  return NextResponse.json(
    { error: `Forbidden: insufficient permissions to ${action}.` },
    { status: 403 },
  );
}
