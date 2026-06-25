import ProductionDashboardShell from "@/components/production/overview/ProductionDashboardShell";
import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";

export const metadata = {
  title: "Overview Dashboard | Parable Streaming Platform",
  description: "Production mission control — live streams, health, alerts, and quick actions.",
};

export default async function ProductionDashboardPage() {
  const user = await requireOpsAdminUser("/production-dashboard");

  return <ProductionDashboardShell operatorEmail={user.email ?? "producer"} />;
}
