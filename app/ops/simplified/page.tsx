import CleanOpsCommandCenter from "@/components/ops/CleanOpsCommandCenter";
import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";
import { loadOpsSnapshot } from "@/lib/ops/snapshot";

export const metadata = {
  title: "Simplified Ops Center | 300 Awakening",
  description: "Beginner-friendly operations dashboard for live event stream control.",
};

export default async function SimplifiedOpsCenterPage() {
  const user = await requireOpsAdminUser("/ops/simplified");
  const snapshot = await loadOpsSnapshot();

  return (
    <CleanOpsCommandCenter
      initialSnapshot={snapshot}
      operatorEmail={user.email ?? "operator"}
    />
  );
}
