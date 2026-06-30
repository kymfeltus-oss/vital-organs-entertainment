import OwnerControlDashboard from "@/components/owner/OwnerControlDashboard";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { fetchOwnerDashboardSnapshot } from "@/lib/snapshot/owner-snapshot"; // Adjust the path if your utility is named differently

export default async function OwnerControlPage() {
  const admin = getSupabaseAdmin();
  
  // 1. Fetch the required snapshot data for the cockpit
  const snapshot = await fetchOwnerDashboardSnapshot(admin);

  // 2. Pass it down to the dashboard component as the expected prop
  return <OwnerControlDashboard snapshot={snapshot} />;
}