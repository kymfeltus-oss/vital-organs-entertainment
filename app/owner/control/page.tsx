import OwnerControlDashboard from "@/components/owner/OwnerControlDashboard";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { buildOwnerBroadcastSnapshot } from "@/lib/owner/build-broadcast-snapshot"; 

export default async function OwnerControlPage() {
  const admin = getSupabaseAdmin();
  
  // 1. Define the mode as 'live' and pass the admin client as the data engine
  // If your project uses a different mode like 'preview', swap 'live' here.
  const snapshot = await buildOwnerBroadcastSnapshot('live', admin);

  // 2. Pass it down
  return <OwnerControlDashboard snapshot={snapshot} />;
}