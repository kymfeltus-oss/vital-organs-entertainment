import ProductionMetricsDashboardClient from "@/components/ops/ProductionMetricsDashboardClient";
import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";

export const metadata = {
  title: "Production Metrics Dashboard | 300 Awakening Ops",
  description: "Read-only production monitoring — stream health, audio, alerts, and attendee signals.",
};

export default async function OpsPage() {
  const user = await requireOpsAdminUser("/ops");

  return (
    <ProductionMetricsDashboardClient operatorEmail={user.email ?? "operator"} />
  );
}
