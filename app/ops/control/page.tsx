import CleanOpsCommandCenter from "@/components/ops/CleanOpsCommandCenter";
import ProductionDashboardBackLink from "@/components/ops/ProductionDashboardBackLink";
import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";
import { loadOpsSnapshot } from "@/lib/ops/snapshot";

export const metadata = {
  title: "Stream Control | 300 Awakening Ops",
  description: "Go live, backup lane, and emergency offline controls.",
};

export default async function OpsControlPage() {
  const user = await requireOpsAdminUser("/ops/control");
  const snapshot = await loadOpsSnapshot();

  return (
    <div className="min-h-dvh bg-brand-black">
      <div className="border-b border-brand-border px-4 py-3 md:px-8">
        <ProductionDashboardBackLink />
      </div>
      <CleanOpsCommandCenter
        initialSnapshot={snapshot}
        operatorEmail={user.email ?? "operator"}
      />
    </div>
  );
}
