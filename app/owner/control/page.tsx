import OwnerControlDashboard from "@/components/owner/OwnerControlDashboard";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { buildBroadcastSnapshot } from "@/lib/owner/build-broadcast-snapshot"; 

export default async function OwnerControlPage() {
  const admin = getSupabaseAdmin();
  
  // 1. Fetch the full broadcast snapshot the dashboard expects
  const snapshot = await buildBroadcastSnapshot(admin);

  // 2. Pass it down
  return <OwnerControlDashboard snapshot={snapshot} />;
}