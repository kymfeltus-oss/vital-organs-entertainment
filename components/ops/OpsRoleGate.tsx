"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { OPS_HOME_PATH } from "@/lib/broadcastRoutes";
import type { OpsHubModuleId } from "@/lib/ops/team-roles";

type OpsRoleGateProps = {
  moduleId: OpsHubModuleId;
  children: ReactNode;
};

export default function OpsRoleGate({ children }: OpsRoleGateProps) {
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
          router.replace(OPS_HOME_PATH);
          return;
        }

        if (cancelled) return;
        setAllowed(true);
      } catch {
        if (!cancelled) {
          router.replace(OPS_HOME_PATH);
        }
      }
    }

    void resolveRole();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!allowed) {
    return null;
  }

  return children;
}
