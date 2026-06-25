import type { OpsTeamRole } from "@/lib/ops/team-roles";
import type { AudioPermissions } from "@/lib/audio/types";

export type AudioRbacRole = AudioPermissions["role"];

export function mapOpsRoleToAudioRole(role: OpsTeamRole, isOpsAdmin: boolean): AudioRbacRole {
  if (isOpsAdmin) return "owner";
  switch (role) {
    case "admin":
      return "admin";
    case "producer":
    case "broadcast_operator":
      return "producer";
    default:
      return "viewer";
  }
}

export function buildAudioPermissions(role: AudioRbacRole): AudioPermissions {
  switch (role) {
    case "owner":
    case "admin":
      return {
        role,
        canView: true,
        canControlBasic: true,
        canControlX32: true,
        canManageSettings: true,
        canManageSnapshots: true,
      };
    case "producer":
      return {
        role,
        canView: true,
        canControlBasic: true,
        canControlX32: true,
        canManageSettings: false,
        canManageSnapshots: true,
      };
    case "viewer":
      return {
        role,
        canView: true,
        canControlBasic: false,
        canControlX32: false,
        canManageSettings: false,
        canManageSnapshots: false,
      };
  }
}
