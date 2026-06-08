/**
 * Operator production console — desktop-only, ops-admin protected.
 * vMix, Restream, readiness, safety, timeline, and Go Live review live here only.
 * Attendee experience: /dashboard/live (no operator controls).
 */
import LiveHubConsole from "@/components/live-hub/LiveHubConsole";
import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";
import { loadOpsSnapshot } from "@/lib/ops/snapshot";

export default async function LiveHubPage() {
  const user = await requireOpsAdminUser("/ops/live-hub");
  const snapshot = await loadOpsSnapshot();

  return (
    <LiveHubConsole
      adminEmail={user.email ?? "unknown"}
      initialSnapshot={snapshot}
    />
  );
}
