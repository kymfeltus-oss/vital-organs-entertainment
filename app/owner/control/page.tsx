import OwnerControlDashboard from "@/components/owner/OwnerControlDashboard";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { loadOwnerStreamState } from "@/lib/owner/load-owner-state"; 

export default async function OwnerControlPage() {
  const admin = getSupabaseAdmin();
  
  // 1. Fetch the state using the function name Turbopack expects
  const snapshot = await loadOwnerStreamState(admin);

  // 2. Pass it down
  return <OwnerControlDashboard snapshot={snapshot} />;
}