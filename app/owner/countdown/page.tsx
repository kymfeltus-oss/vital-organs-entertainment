import { redirect } from "next/navigation";
import OwnerCountdownControlClient from "@/components/owner/OwnerCountdownControlClient";
import { buildTeamGateUrl } from "@/lib/auth/routing";
import { requireOwnerUser } from "@/lib/owner/auth";
import { loadShowSetupState } from "@/lib/owner/show-setup-state";

export const dynamic = "force-dynamic";

export default async function OwnerCountdownPage() {
  const auth = await requireOwnerUser();
  if (!auth.ok) {
    redirect(buildTeamGateUrl("/owner/countdown"));
  }

  const initialState = await loadShowSetupState();

  return <OwnerCountdownControlClient initialState={initialState} />;
}
