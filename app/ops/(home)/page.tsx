import CleanOpsCommandCenter from "@/components/ops/CleanOpsCommandCenter";
import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";
import { loadOpsSnapshot } from "@/lib/ops/snapshot";

export default async function OpsPage() {
  const user = await requireOpsAdminUser("/ops");
  const snapshot = await loadOpsSnapshot();

  return (
    <CleanOpsCommandCenter
      initialSnapshot={snapshot}
      operatorEmail={user.email ?? "operator"}
    />
  );
}
