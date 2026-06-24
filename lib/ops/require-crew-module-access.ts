import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";
import { inspectOpsAdminAccess } from "@/lib/ops/admin-auth";
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

  // Allowlisted ops admins always reach production routes; crew role filters menus/API only.
  if (inspectOpsAdminAccess(user).allowed || isOpsRoleCheckBypassed(user)) {
    return { user, role };
  }

  if (!canAccessModule(role, moduleId)) {
    const params = new URLSearchParams({
      reason: "insufficient_crew_clearance",
      module: moduleId,
    });
    redirect(`/ops/unauthorized?${params.toString()}`);
  }

  return { user, role };
}
