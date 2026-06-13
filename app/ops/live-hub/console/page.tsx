import LiveHubConsole from "@/components/live-hub/LiveHubConsole";
import OpsRoleGate from "@/components/ops/OpsRoleGate";
import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";
import { loadOpsSnapshot } from "@/lib/ops/snapshot";

export default async function LiveHubConsolePage() {
  const user = await requireOpsAdminUser("/ops/live-hub/console");
  const snapshot = await loadOpsSnapshot();

  return (
    <OpsRoleGate moduleId="crew_console">
      <LiveHubConsole
        adminEmail={user.email ?? "unknown"}
        initialSnapshot={snapshot}
      />
    </OpsRoleGate>
  );
}
