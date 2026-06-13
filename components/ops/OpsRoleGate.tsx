"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  canAccessModule,
  isOpsTeamRole,
  OPS_TEAM_ROLE_STORAGE_KEY,
  type OpsHubModuleId,
  type OpsTeamRole,
} from "@/lib/ops/team-roles";

type OpsRoleGateProps = {
  moduleId: OpsHubModuleId;
  children: ReactNode;
};

export default function OpsRoleGate({ moduleId, children }: OpsRoleGateProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(OPS_TEAM_ROLE_STORAGE_KEY);
    const role: OpsTeamRole = isOpsTeamRole(stored) ? stored : "admin";

    if (!canAccessModule(role, moduleId)) {
      router.replace("/ops/live-hub");
      return;
    }

    setAllowed(true);
  }, [moduleId, router]);

  if (!allowed) {
    return null;
  }

  return children;
}
