"use client";

import ProductionAppShell from "@/components/production/shell/ProductionAppShell";
import ProductionOverviewClient from "@/components/production/overview/ProductionOverviewClient";
import { useProductionDashboardMetrics } from "@/hooks/useProductionDashboardMetrics";

type ProductionDashboardShellProps = {
  operatorEmail: string;
};

export default function ProductionDashboardShell({ operatorEmail }: ProductionDashboardShellProps) {
  const metrics = useProductionDashboardMetrics(operatorEmail);

  const systemHealthy =
    metrics.opsState?.apiOk !== false && metrics.opsState?.pullEngineStatus !== "error";

  return (
    <ProductionAppShell
      operatorEmail={operatorEmail}
      roleDisplay={metrics.roleDisplay}
      profileInitials={metrics.profileInitials}
      systemHealthy={systemHealthy}
      isRefreshing={metrics.isRefreshing}
      onRefresh={() => void metrics.refresh()}
      title="Overview Dashboard"
    >
      <ProductionOverviewClient metrics={metrics} />
    </ProductionAppShell>
  );
}
