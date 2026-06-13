import OpsModuleShell from "@/components/ops/OpsModuleShell";
import OpsRoleGate from "@/components/ops/OpsRoleGate";
import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";

export default async function LiveHubPrayerQueuePage() {
  await requireOpsAdminUser("/ops/live-hub/prayer-queue");

  return (
    <OpsRoleGate moduleId="prayer_queue">
      <OpsModuleShell
        eyebrow="Prayer Team"
        title="Prayer Queue"
        description="Filtered moderation view for live prayer requests. V1 skeleton — queue ingestion will connect to fellowship chat and prayer wall APIs."
      >
        <div className="glass-panel rounded-2xl border border-brand-border p-6">
          <p className="font-body text-sm text-brand-muted">
            No queued requests in this mock view. When live, incoming prayer submissions from
            `/experience/prayer` and the live fellowship panel will surface here for team response.
          </p>
        </div>
      </OpsModuleShell>
    </OpsRoleGate>
  );
}
