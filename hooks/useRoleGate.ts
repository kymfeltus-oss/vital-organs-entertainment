"use client";

import { useEffect, useMemo, useState } from "react";
import type { RoleGateResult, UserRole } from "@/lib/broadcast/countdown-console-types";
import { OPS_CREW_ROLE_API_PATH } from "@/lib/broadcastRoutes";
import { isOpsTeamRole, type OpsTeamRole } from "@/lib/ops/team-roles";

function mapOpsRoleToUserRole(role: OpsTeamRole | null | undefined): UserRole {
  switch (role) {
    case "admin":
      return "admin";
    case "producer":
      return "producer";
    case "broadcast_operator":
      return "broadcast_operator";
    case "prayer_team":
      return "prayer_team";
    case "camera_crew":
      return "camera_crew";
    default:
      return "unknown";
  }
}

function buildGateResult(role: UserRole, canStreamMutate: boolean): RoleGateResult {
  const isPrivileged = role === "admin" || role === "producer";

  return {
    role,
    canEdit: isPrivileged,
    canSave: isPrivileged,
    canGoLive: isPrivileged && canStreamMutate,
    canClearAlerts: isPrivileged,
    isReadOnly: !isPrivileged,
  };
}

const DEFAULT_GATE = buildGateResult("broadcast_operator", false);

/** Resolve crew permissions for countdown production console. */
export function useRoleGate(): RoleGateResult {
  const [role, setRole] = useState<UserRole>("unknown");
  const [canStreamMutate, setCanStreamMutate] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      try {
        const response = await fetch(OPS_CREW_ROLE_API_PATH, {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok || cancelled) return;

        const data = (await response.json()) as {
          role?: string;
          canStreamMutate?: boolean;
        };

        const mapped = isOpsTeamRole(data.role)
          ? mapOpsRoleToUserRole(data.role)
          : "unknown";

        if (!cancelled) {
          setRole(mapped);
          setCanStreamMutate(data.canStreamMutate === true);
        }
      } catch {
        if (!cancelled) {
          setRole("unknown");
          setCanStreamMutate(false);
        }
      }
    }

    void loadRole();

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => buildGateResult(role, canStreamMutate), [canStreamMutate, role]);
}

export type { RoleGateResult, UserRole };
