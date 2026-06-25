import type { OpsTeamRole } from "@/lib/ops/team-roles";
import type { IncidentPermissions, IncidentRbacRole } from "@/lib/incidents/types";

export function mapOpsRoleToIncidentRole(role: OpsTeamRole, isOpsAdmin: boolean): IncidentRbacRole {
  if (isOpsAdmin) return "owner";
  switch (role) {
    case "admin":
      return "admin";
    case "producer":
      return "producer";
    default:
      return "viewer";
  }
}

export function buildIncidentPermissions(role: IncidentRbacRole): IncidentPermissions {
  switch (role) {
    case "owner":
    case "admin":
      return {
        role,
        canView: true,
        canExport: true,
        canReview: true,
        canEscalate: true,
        canResolve: true,
      };
    case "producer":
      return {
        role,
        canView: true,
        canExport: true,
        canReview: true,
        canEscalate: true,
        canResolve: false,
      };
    case "viewer":
      return {
        role,
        canView: true,
        canExport: false,
        canReview: false,
        canEscalate: false,
        canResolve: false,
      };
  }
}
