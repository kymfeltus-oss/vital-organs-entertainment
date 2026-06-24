import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";

export default async function ProductionDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOpsAdminUser("/ops/production-dashboard");
  return children;
}
