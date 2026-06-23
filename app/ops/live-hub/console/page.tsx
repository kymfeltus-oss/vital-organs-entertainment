import CleanLiveConsole from "@/components/ops/CleanLiveConsole";
import OpsRoleGate from "@/components/ops/OpsRoleGate";
import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";
import { loadOpsStreamSnapshot } from "@/lib/ops/snapshot";

export default async function LiveHubConsolePage() {
  await requireOpsAdminUser("/ops/live-hub/console");
  const initialStream = await loadOpsStreamSnapshot();

  return (
    <OpsRoleGate moduleId="crew_console">
      <CleanLiveConsole initialStream={initialStream} />
    </OpsRoleGate>
  );
}
