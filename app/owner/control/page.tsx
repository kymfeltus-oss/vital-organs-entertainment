import OwnerControlDashboard from "@/components/owner/OwnerControlDashboard";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { buildOwnerBroadcastSnapshot } from "@/lib/owner/build-broadcast-snapshot"; 

export default async function OwnerControlPage() {
  const admin = getSupabaseAdmin();
  
  // 1. Fetch using the function name Turbopack confirmed
  const snapshot = await buildOwnerBroadcastSnapshot(admin);

  // 2. Pass it down
  return <OwnerControlDashboard snapshot={snapshot} />;
}