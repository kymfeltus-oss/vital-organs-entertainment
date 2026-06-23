"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  canAccessModule,
  isOpsTeamRole,
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
    let cancelled = false;

    async function resolveRole() {
      try {
        const response = await fetch("/api/ops/crew-role", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) {
          router.replace("/ops/live-hub");
          return;
        }

        const data = (await response.json()) as { role?: string };
        const role: OpsTeamRole = isOpsTeamRole(data.role) ? data.role : "admin";

        if (cancelled) return;

        if (!canAccessModule(role, moduleId)) {
          router.replace("/ops/live-hub");
          return;
        }

        setAllowed(true);
      } catch {
        if (!cancelled) {
          router.replace("/ops/live-hub");
        }
      }
    }

    void resolveRole();

    return () => {
      cancelled = true;
    };
  }, [moduleId, router]);

  if (!allowed) {
    return null;
  }

  return children;
}
