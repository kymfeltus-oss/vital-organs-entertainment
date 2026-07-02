import { redirect } from "next/navigation";
import ProductionCockpitClient from "@/components/owner/ProductionCockpitClient";
import { buildTeamGateUrl } from "@/lib/auth/routing";
import { requireOwnerUser } from "@/lib/owner/auth";

export const dynamic = "force-dynamic";

export default async function OwnerCockpitPage() {
  const auth = await requireOwnerUser();
  if (!auth.ok) {
    redirect(buildTeamGateUrl("/owner/cockpit"));
  }

  return <ProductionCockpitClient />;
}
