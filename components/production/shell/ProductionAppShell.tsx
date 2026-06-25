"use client";

import type { ReactNode } from "react";
import ProductionHeader from "@/components/production/shell/ProductionHeader";
import ProductionSidebar from "@/components/production/shell/ProductionSidebar";

type ProductionAppShellProps = {
  children: ReactNode;
  operatorEmail: string;
  roleDisplay?: string;
  profileInitials?: string;
  systemHealthy?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  title?: string;
  hideHeader?: boolean;
};

export default function ProductionAppShell({
  children,
  operatorEmail,
  roleDisplay = "Full Access",
  profileInitials = "PR",
  systemHealthy = true,
  isRefreshing,
  onRefresh,
  title,
  hideHeader = false,
}: ProductionAppShellProps) {
  return (
    <div className="flex h-dvh overflow-hidden bg-black text-white">
      <ProductionSidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {!hideHeader ? (
          <ProductionHeader
            operatorEmail={operatorEmail}
            roleDisplay={roleDisplay}
            profileInitials={profileInitials}
            systemHealthy={systemHealthy}
            isRefreshing={isRefreshing}
            onRefresh={onRefresh}
            title={title}
          />
        ) : null}

        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
