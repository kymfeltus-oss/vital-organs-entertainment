import type { User } from "@supabase/supabase-js";
import { inspectOpsAdminAccess } from "@/lib/ops/admin-auth";
import { isOpsRoleCheckBypassed } from "@/lib/ops/crew-role-auth";
import { parseEmailAllowlist } from "@/lib/ops/parse-email-allowlist";
import type { OpsTeamRole } from "@/lib/ops/team-roles";

function adminAllowlistEmails(): string[] {
  return parseEmailAllowlist(process.env.ADMIN_EMAILS);
}

function producerAllowlistEmails(): string[] {
  const producerList = parseEmailAllowlist(process.env.OPS_PRODUCER_EMAILS);
  if (producerList.length > 0) return producerList;
  return adminAllowlistEmails();
}

export type CrewRoleAssignmentResult =
  | { allowed: true }
  | { allowed: false; reason: string };

/** Server-side validation before writing ops_crew_role cookie. */
export function validateCrewRoleAssignment(
  user: User,
  requestedRole: OpsTeamRole,
): CrewRoleAssignmentResult {
  if (isOpsRoleCheckBypassed(user)) {
    return { allowed: true };
  }

  const inspection = inspectOpsAdminAccess(user);
  if (!inspection.allowed) {
    return { allowed: false, reason: "Ops admin access required." };
  }

  const email = inspection.normalizedEmail;
  if (!email) {
    return { allowed: false, reason: "Signed-in account must have an email." };
  }

  if (requestedRole === "admin") {
    if (inspection.metadataOpsAdmin || inspection.allowlistMatch) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "Forbidden: Your account cannot assume the admin crew role.",
    };
  }

  if (requestedRole === "producer") {
    if (producerAllowlistEmails().includes(email) || inspection.metadataOpsAdmin) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "Forbidden: Your account cannot assume the producer crew role.",
    };
  }

  return { allowed: true };
}
