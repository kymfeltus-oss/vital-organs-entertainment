"use client";

import type { OpsSnapshot } from "@/lib/ops/types";

type OpsIncidentDrawerContentProps = {
  accessLogs: OpsSnapshot["accessLogs"];
};

export default function OpsIncidentDrawerContent({
  accessLogs,
}: OpsIncidentDrawerContentProps) {
  const recentLogs = accessLogs.slice(0, 12);

  return (
    <div className="glass-panel overflow-hidden rounded-2xl border border-brand-border">
      <ul className="divide-y divide-brand-border">
        {recentLogs.length === 0 ? (
          <li className="p-6 font-body text-sm text-brand-muted">No access log entries yet.</li>
        ) : (
          recentLogs.map((log) => (
            <li
              key={log.id}
              className="flex flex-col gap-1 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white">
                  {log.result}
                </p>
                <p className="mt-1 font-body text-xs text-brand-muted">{log.reason || "—"}</p>
              </div>
              <p className="font-ui text-[0.52rem] uppercase tracking-[0.1em] text-brand-muted">
                {new Date(log.created_at).toLocaleString()}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
