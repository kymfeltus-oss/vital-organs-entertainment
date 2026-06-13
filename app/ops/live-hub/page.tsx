/**
 * Operator crew terminal — role-based module router (mock client-side roles).
 * Attendee experience: /experience (hub) and /experience/live (no operator controls).
 */
import LiveHubRoleRouterClient from "@/components/ops/LiveHubRoleRouterClient";
import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";
import { loadOpsSnapshot } from "@/lib/ops/snapshot";

export default async function LiveHubPage() {
  const user = await requireOpsAdminUser("/ops/live-hub");
  const snapshot = await loadOpsSnapshot();

  return (
    <LiveHubRoleRouterClient
      adminEmail={user.email ?? "unknown"}
      initialSnapshot={snapshot}
    />
  );
}
