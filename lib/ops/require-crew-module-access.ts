import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";
import {
  isOpsRoleCheckBypassed,
  readOpsCrewRoleCookie,
  resolveOpsCrewRole,
} from "@/lib/ops/crew-role-auth";
import { canAccessModule, type OpsHubModuleId } from "@/lib/ops/team-roles";

export type CrewModuleAccessContext = {
  user: User;
  role: ReturnType<typeof resolveOpsCrewRole>;
};

export async function requireCrewModuleAccess(
  moduleId: OpsHubModuleId,
  returnPath: string,
): Promise<CrewModuleAccessContext> {
  const user = await requireOpsAdminUser(returnPath);
  const cookieRole = await readOpsCrewRoleCookie();
  const role = resolveOpsCrewRole(user, cookieRole);

  if (!isOpsRoleCheckBypassed(user) && !canAccessModule(role, moduleId)) {
    const params = new URLSearchParams({
      reason: "insufficient_crew_clearance",
      module: moduleId,
    });
    redirect(`/ops/unauthorized?${params.toString()}`);
  }

  return { user, role };
}
