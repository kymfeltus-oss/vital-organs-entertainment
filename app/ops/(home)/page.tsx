import OpsCommandCenter from "@/components/ops/OpsCommandCenter";
import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";
import { loadOpsSnapshot } from "@/lib/ops/snapshot";

export default async function OpsPage() {
  const user = await requireOpsAdminUser("/ops");
  const snapshot = await loadOpsSnapshot();

  return (
    <OpsCommandCenter
      initialSnapshot={snapshot}
      adminEmail={user.email ?? "unknown"}
    />
  );
}
