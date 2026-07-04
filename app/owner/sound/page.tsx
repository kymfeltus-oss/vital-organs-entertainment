import { redirect } from "next/navigation";
import OwnerSoundControlClient from "@/components/owner/OwnerSoundControlClient";
import { buildTeamGateUrl } from "@/lib/auth/routing";
import { requireOwnerUser } from "@/lib/owner/auth";

export const dynamic = "force-dynamic";

export default async function OwnerSoundPage() {
  const auth = await requireOwnerUser();
  if (!auth.ok) {
    redirect(buildTeamGateUrl("/owner/sound"));
  }

  return <OwnerSoundControlClient initialOperatorEmail={auth.email} />;
}
