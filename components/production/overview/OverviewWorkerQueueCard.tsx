"use client";

import type { OpsStreamState } from "@/lib/ops/ops-stream-state";

type OverviewWorkerQueueCardProps = {
  opsState: OpsStreamState | null;
};

function DonutSegment({
  label,
  value,
  color,
  total,
}: {
  label: string;
  value: number;
  color: string;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between font-body text-xs">
      <span className="flex items-center gap-2 text-brand-muted">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
        {label}
      </span>
      <span className="text-white">
        {value} ({pct}%)
      </span>
    </div>
  );
}

export function OverviewWorkerPoolCard({ opsState }: OverviewWorkerQueueCardProps) {
  const online = opsState?.pullEngineStatus === "running" ? 1 : 0;
  const busy = opsState?.isLive ? 1 : 0;
  const offline = online === 0 ? 1 : 0;
  const total = Math.max(online + busy + offline, 1);

  return (
    <section className="rounded-xl border border-brand-border bg-brand-panel/40 p-4">
      <h2 className="mb-3 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
        Worker Pool
      </h2>
      <div className="mb-3 flex items-center justify-center">
        <div
          aria-hidden="true"
          className="relative flex h-24 w-24 items-center justify-center rounded-full border-[10px] border-brand-border"
          style={{
            background: `conic-gradient(#34d399 0 ${(online / total) * 360}deg, #6366f1 ${(online / total) * 360}deg ${((online + busy) / total) * 360}deg, #475569 ${((online + busy) / total) * 360}deg 360deg)`,
          }}
        >
          <span className="rounded-full bg-brand-panel px-2 py-1 font-mono text-xs text-white">
            {total}
          </span>
        </div>
      </div>
      <div className="space-y-1.5">
        <DonutSegment label="Online" value={online} color="#34d399" total={total} />
        <DonutSegment label="Busy" value={busy} color="#6366f1" total={total} />
        <DonutSegment label="Offline" value={offline} color="#475569" total={total} />
      </div>
      <p className="mt-3 font-body text-xs text-brand-muted">
        Auto scale: standby · Max workers not connected
      </p>
    </section>
  );
}

export function OverviewQueueCard() {
  return (
    <section className="rounded-xl border border-brand-border bg-brand-panel/40 p-4">
      <h2 className="mb-3 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
        Queue Overview
      </h2>
      <p className="mb-3 font-body text-xs text-brand-muted">Celery queue not connected</p>
      <div className="space-y-1.5 font-body text-xs text-brand-muted">
        <div className="flex justify-between">
          <span>Pending</span>
          <span>—</span>
        </div>
        <div className="flex justify-between">
          <span>Processing</span>
          <span>—</span>
        </div>
        <div className="flex justify-between">
          <span>Failed</span>
          <span>—</span>
        </div>
        <div className="flex justify-between">
          <span>Completed</span>
          <span>—</span>
        </div>
      </div>
    </section>
  );
}

export function OverviewStorageCard() {
  return (
    <section className="rounded-xl border border-brand-border bg-brand-panel/40 p-4">
      <h2 className="mb-3 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
        Storage & Recordings
      </h2>
      <p className="font-body text-xs text-brand-muted">MinIO / S3 storage not connected</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-black">
        <div className="h-full w-[35%] rounded-full bg-brand-purple" />
      </div>
      <p className="mt-2 font-mono text-xs text-brand-muted">Usage unavailable</p>
    </section>
  );
}
