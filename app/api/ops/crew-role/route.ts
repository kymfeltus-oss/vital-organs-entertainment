import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdminApiUser } from "@/lib/ops/assert-ops-admin";
import { validateCrewRoleAssignment } from "@/lib/ops/crew-role-assignment";
import {
  buildOpsCrewRoleCookie,
  buildCrewRoleCapabilities,
  getCrewRoleFromRequest,
} from "@/lib/ops/crew-role-auth";
import {
  isOpsTeamRole,
  modulesForRole,
  roleLabel,
  type OpsTeamRole,
} from "@/lib/ops/team-roles";

export async function GET(request: NextRequest) {
  const gate = await requireOpsAdminApiUser();
  if (gate.response) return gate.response;

  const { role, capabilities } = await getCrewRoleFromRequest(request);

  return NextResponse.json(
    {
      role,
      roleLabel: roleLabel(role),
      capabilities,
      canStreamMutate: capabilities.canStreamMutate,
      canOpsMutate: capabilities.canStreamMutate,
      modules: modulesForRole(role).map((module) => module.id),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

type CrewRoleBody = {
  role?: unknown;
  requestedRole?: unknown;
};

export async function POST(request: NextRequest) {
  const gate = await requireOpsAdminApiUser();
  if (gate.response) return gate.response;

  try {
    const body = (await request.json()) as CrewRoleBody;
    const nextRole = body.role ?? body.requestedRole;

    if (!isOpsTeamRole(nextRole)) {
      return NextResponse.json({ error: "Invalid crew role." }, { status: 400 });
    }

    const assignment = validateCrewRoleAssignment(gate.user, nextRole);
    if (!assignment.allowed) {
      console.warn("[OPS_CREW_ROLE_DENIED]:", {
        email: gate.user.email,
        requestedRole: nextRole,
        reason: assignment.reason,
      });
      return NextResponse.json({ error: assignment.reason }, { status: 403 });
    }

    const capabilities = buildCrewRoleCapabilities(nextRole, gate.user);

    const response = NextResponse.json({
      success: true,
      role: nextRole as OpsTeamRole,
      assignedRole: nextRole,
      roleLabel: roleLabel(nextRole),
      capabilities,
      canStreamMutate: capabilities.canStreamMutate,
      canOpsMutate: capabilities.canStreamMutate,
      modules: modulesForRole(nextRole).map((module) => module.id),
    });

    response.cookies.set(buildOpsCrewRoleCookie(nextRole));

    return response;
  } catch (error) {
    console.error("[OPS_CREW_ROLE_POST_ERR]:", error);
    return NextResponse.json(
      { error: "Unable to update crew role." },
      { status: 500 },
    );
  }
}
