import OwnerControlDashboard from "@/components/owner/OwnerControlDashboard";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { loadOwnerState } from "@/lib/owner/load-owner-state"; 

export default async function OwnerControlPage() {
  const admin = getSupabaseAdmin();
  
  // 1. Fetch the required state snapshot using the canonical owner loader
  const snapshot = await loadOwnerState(admin);

  // 2. Pass it down to the dashboard component
  return <OwnerControlDashboard snapshot={snapshot} />;
}