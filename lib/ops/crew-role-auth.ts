import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { inspectOpsAdminAccess } from "@/lib/ops/admin-auth";
import { isOpsTeamRole, type OpsTeamRole } from "@/lib/ops/team-roles";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";

export const OPS_CREW_ROLE_COOKIE = "ops_crew_role";

const OPS_CREW_ROLE_COOKIE_MAX_AGE_SEC = 60 * 60 * 12;

export type CrewRoleCapabilities = {
  canStreamMutate: boolean;
  canViewMetrics: boolean;
};

export function resolveOpsCrewRole(
  user: User,
  cookieRole: string | undefined | null,
): OpsTeamRole {
  const metadataRole = user.user_metadata?.ops_team_role;
  if (isOpsTeamRole(metadataRole)) return metadataRole;
  if (isOpsTeamRole(cookieRole)) return cookieRole;

  const inspection = inspectOpsAdminAccess(user);
  if (inspection.allowed) return "admin";

  return "prayer_team";
}

export function isOpsRoleCheckBypassed(user: User): boolean {
  return inspectOpsAdminAccess(user).devBypassActive;
}

export function canPerformStreamMutation(role: OpsTeamRole): boolean {
  return role === "admin" || role === "producer";
}

export function canPerformOpsMutation(role: OpsTeamRole): boolean {
  return role === "admin" || role === "producer";
}

export function buildCrewRoleCapabilities(
  role: OpsTeamRole,
  user: User | null,
): CrewRoleCapabilities {
  const bypassed = user ? isOpsRoleCheckBypassed(user) : false;

  return {
    canStreamMutate: bypassed || canPerformStreamMutation(role),
    canViewMetrics:
      bypassed ||
      role === "admin" ||
      role === "producer" ||
      role === "broadcast_operator",
  };
}

export async function readOpsCrewRoleCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(OPS_CREW_ROLE_COOKIE)?.value;
}

export async function getCrewRoleFromRequest(
  request?: NextRequest,
): Promise<{ role: OpsTeamRole; capabilities: CrewRoleCapabilities }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieRole =
    request?.cookies.get(OPS_CREW_ROLE_COOKIE)?.value ??
    (await readOpsCrewRoleCookie());

  const role = user ? resolveOpsCrewRole(user, cookieRole) : "prayer_team";
  const capabilities = buildCrewRoleCapabilities(role, user);

  return { role, capabilities };
}

export function opsStreamMutationForbiddenResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "Forbidden: Insufficient crew role permissions.",
      code: "OPS_ROLE_FORBIDDEN",
    },
    { status: 403 },
  );
}

export function opsMutationForbiddenResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "Forbidden: Access Gated",
      code: "OPS_ROLE_FORBIDDEN",
    },
    { status: 403 },
  );
}

export function assertOpsStreamMutationAllowed(
  user: User,
  capabilities: CrewRoleCapabilities,
): NextResponse | null {
  if (isOpsRoleCheckBypassed(user)) return null;
  if (!capabilities.canStreamMutate) {
    return opsStreamMutationForbiddenResponse();
  }
  return null;
}

export function buildOpsCrewRoleCookie(role: OpsTeamRole): {
  name: string;
  value: string;
  maxAge: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
} {
  return {
    name: OPS_CREW_ROLE_COOKIE,
    value: role,
    maxAge: OPS_CREW_ROLE_COOKIE_MAX_AGE_SEC,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}
