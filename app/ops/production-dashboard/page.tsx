import OpsProductionModuleClient from "@/components/ops/production/OpsProductionModuleClient";
import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";

export const metadata = {
  title: "Production Dashboard | 300 Awakening Ops",
  description: "Read-only production monitoring — stream health, audio, alerts, and attendee signals.",
};

export default async function ProductionDashboardPage() {
  const user = await requireOpsAdminUser("/ops/production-dashboard");

  return <OpsProductionModuleClient operatorEmail={user.email ?? "operator"} />;
}
