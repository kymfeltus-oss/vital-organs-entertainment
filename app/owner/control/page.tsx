import OwnerControlDashboard from "@/components/owner/OwnerControlDashboard";
import { buildOwnerBroadcastSnapshot } from "@/lib/owner/build-broadcast-snapshot";

export default async function OwnerControlPage() {
  // 1. Fetch the result object from the broadcast utility
  const result = await buildOwnerBroadcastSnapshot("none");
  
  // 2. Destructure the snapshot to satisfy the OwnerControlDashboard interface
  const snapshot = result.snapshot;

  // 3. Pass the validated snapshot to the dashboard
  return <OwnerControlDashboard snapshot={snapshot} />;
}