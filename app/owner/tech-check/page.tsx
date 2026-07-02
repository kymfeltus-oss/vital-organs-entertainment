import { redirect } from "next/navigation";
import OwnerTechCheckClient from "@/components/owner/OwnerTechCheckClient";
import { buildTeamGateUrl } from "@/lib/auth/routing";
import { requireOwnerUser } from "@/lib/owner/auth";

export const dynamic = "force-dynamic";

export default async function OwnerTechCheckPage() {
  const auth = await requireOwnerUser();
  if (!auth.ok) {
    redirect(buildTeamGateUrl("/owner/tech-check"));
  }

  return <OwnerTechCheckClient />;
}
