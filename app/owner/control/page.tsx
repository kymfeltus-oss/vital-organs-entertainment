import OwnerControlDashboard from "@/components/owner/OwnerControlDashboard";
import { buildOwnerBroadcastSnapshot } from "@/lib/owner/build-broadcast-snapshot"; 

export default async function OwnerControlPage() {
  // 1. Initialize with 'none' mode to satisfy the PublishMode union type
  // This prevents the build error and allows the dashboard to mount safely.
  const snapshot = await buildOwnerBroadcastSnapshot("none");

  // 2. Pass it down
  return <OwnerControlDashboard snapshot={snapshot} />;
}