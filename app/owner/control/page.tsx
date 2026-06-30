import OwnerControlDashboard from "@/components/owner/OwnerControlDashboard";
import { buildOwnerBroadcastSnapshot } from "@/lib/owner/build-broadcast-snapshot"; 

export default async function OwnerControlPage() {
  // 1. Fetch the snapshot using the required PublishMode string
  // 'published' is the standard production mode; use 'live' or 'preview' if needed.
  const snapshot = await buildOwnerBroadcastSnapshot("published");

  // 2. Pass it down to the dashboard
  return <OwnerControlDashboard snapshot={snapshot} />;
}