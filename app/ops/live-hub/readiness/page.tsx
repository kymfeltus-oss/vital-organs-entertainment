import OpsModuleShell from "@/components/ops/OpsModuleShell";
import OpsRoleGate from "@/components/ops/OpsRoleGate";
import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";
import { loadOpsSnapshot } from "@/lib/ops/snapshot";

export default async function LiveHubReadinessPage() {
  await requireOpsAdminUser("/ops/live-hub/readiness");
  const snapshot = await loadOpsSnapshot();

  return (
    <OpsRoleGate moduleId="readiness">
      <OpsModuleShell
        eyebrow="Show Readiness"
        title="Checklist Matrix"
        description="Pre-show interlock status for producers. Full interactive checklist lives in the Crew Console — this view surfaces the current signal snapshot."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="glass-panel rounded-2xl border border-brand-border p-5">
            <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.18em] text-brand-muted">
              Primary Playback
            </p>
            <p className="mt-3 font-card-title text-xl uppercase text-white">
              {snapshot.stream.primaryPlaybackUrlStatus}
            </p>
          </div>
          <div className="glass-panel rounded-2xl border border-brand-border p-5">
            <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.18em] text-brand-muted">
              Backup Playback
            </p>
            <p className="mt-3 font-card-title text-xl uppercase text-white">
              {snapshot.stream.backupPlaybackUrlStatus}
            </p>
          </div>
          <div className="glass-panel rounded-2xl border border-brand-border p-5">
            <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.18em] text-brand-muted">
              Active Source
            </p>
            <p className="mt-3 font-card-title text-xl uppercase text-white">
              {snapshot.stream.activeSource || "Unassigned"}
            </p>
          </div>
        </div>
      </OpsModuleShell>
    </OpsRoleGate>
  );
}
