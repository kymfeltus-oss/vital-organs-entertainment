import type { OpsTeamRole } from "@/lib/ops/team-roles";
import type { ServicePermissions } from "@/lib/todays-service/types";

export type ServiceRole = "admin" | "producer" | "operator" | "viewer";

export function mapOpsRoleToServiceRole(role: OpsTeamRole, isOpsAdmin: boolean): ServiceRole {
  if (isOpsAdmin || role === "admin") return "admin";
  if (role === "producer") return "producer";
  if (role === "broadcast_operator" || role === "camera_crew") return "operator";
  return "viewer";
}

export function buildServicePermissions(role: ServiceRole): ServicePermissions {
  switch (role) {
    case "admin":
    case "producer":
      return { canView: true, canEdit: true, canBeginService: true, canTest: true };
    case "operator":
      return { canView: true, canEdit: true, canBeginService: false, canTest: true };
    default:
      return { canView: true, canEdit: false, canBeginService: false, canTest: false };
  }
}
