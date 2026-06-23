import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { requireOpsAdminApiUser } from "@/lib/ops/assert-ops-admin";
import {
  assertOpsStreamMutationAllowed,
  getCrewRoleFromRequest,
  isOpsRoleCheckBypassed,
  type CrewRoleCapabilities,
} from "@/lib/ops/crew-role-auth";
import type { OpsTeamRole } from "@/lib/ops/team-roles";
import { NextResponse } from "next/server";

type OpsMutationGateSuccess = {
  user: User;
  role: OpsTeamRole;
  capabilities: CrewRoleCapabilities;
  response: null;
};

type OpsMutationGateFailure = {
  user: null;
  role: null;
  capabilities: null;
  response: Response;
};

export async function requireOpsStreamMutationApiUser(
  request?: NextRequest,
): Promise<OpsMutationGateSuccess | OpsMutationGateFailure> {
  const gate = await requireOpsAdminApiUser();
  if (gate.response) {
    return {
      user: null,
      role: null,
      capabilities: null,
      response: gate.response,
    };
  }

  const { role, capabilities } = await getCrewRoleFromRequest(request);
  const roleDenied = assertOpsStreamMutationAllowed(gate.user, capabilities);
  if (roleDenied) {
    return {
      user: null,
      role: null,
      capabilities: null,
      response: roleDenied,
    };
  }

  return {
    user: gate.user,
    role,
    capabilities,
    response: null,
  };
}

type OpsMetricsGateSuccess = {
  user: User;
  role: OpsTeamRole;
  capabilities: CrewRoleCapabilities;
  response: null;
};

type OpsMetricsGateFailure = {
  user: null;
  role: null;
  capabilities: null;
  response: Response;
};

export async function requireOpsMetricsApiUser(
  request?: NextRequest,
): Promise<OpsMetricsGateSuccess | OpsMetricsGateFailure> {
  const gate = await requireOpsAdminApiUser();
  if (gate.response) {
    return {
      user: null,
      role: null,
      capabilities: null,
      response: gate.response,
    };
  }

  const { role, capabilities } = await getCrewRoleFromRequest(request);

  if (!isOpsRoleCheckBypassed(gate.user) && !capabilities.canViewMetrics) {
    return {
      user: null,
      role: null,
      capabilities: null,
      response: NextResponse.json(
        {
          error: "Forbidden: Insufficient crew role permissions for ops metrics.",
          code: "OPS_METRICS_FORBIDDEN",
        },
        { status: 403 },
      ),
    };
  }

  return {
    user: gate.user,
    role,
    capabilities,
    response: null,
  };
}
