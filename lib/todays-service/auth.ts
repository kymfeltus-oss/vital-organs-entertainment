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
import { buildServicePermissions, mapOpsRoleToServiceRole } from "@/lib/todays-service/rbac";
import type { ServicePermissions } from "@/lib/todays-service/types";

export type ServiceAuthContext = {
  user: User;
  permissions: ServicePermissions;
  tenantId: string;
};

export async function requireServiceApiUser(
  request?: NextRequest,
): Promise<{ context: ServiceAuthContext | null; response: NextResponse | null }> {
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

  if (!isOpsAdmin && !canAccessModule(role, "readiness")) {
    return {
      context: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const serviceRole = mapOpsRoleToServiceRole(role, isOpsAdmin);
  const permissions = buildServicePermissions(serviceRole);

  return {
    context: {
      user,
      permissions,
      tenantId: "300-awakening",
    },
    response: null,
  };
}

export function serviceForbiddenResponse(action: string): NextResponse {
  return NextResponse.json(
    { error: `You do not have permission to ${action}.` },
    { status: 403 },
  );
}
