"use client";

import type { LiveReadinessState } from "@/lib/todays-service/types";
import { statusColorClass, statusLabel } from "@/lib/todays-service/types";

type ReadinessCardProps = {
  readiness: LiveReadinessState;
  onViewChecklist: () => void;
  onRefresh: () => void;
  onFixIssues: () => void;
  refreshing?: boolean;
};

const SECTION_LABELS: Record<keyof LiveReadinessState["sections"], string> = {
  sound: "Sound",
  cameras: "Cameras",
  internet: "Internet",
  livestream: "Livestream",
  recording: "Recording",
  presentation: "Presentation",
};

export default function ReadinessCard({
  readiness,
  onViewChecklist,
  onRefresh,
  onFixIssues,
  refreshing,
}: ReadinessCardProps) {
  const percent = readiness.readinessPercent;
  const ringColor = percent >= 80 ? "text-emerald-400" : percent >= 50 ? "text-amber-400" : "text-red-400";

  return (
    <section className="glass-panel rounded-xl border border-brand-border p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 border-current ${ringColor}`}
          >
            <span className={`font-headline text-2xl ${ringColor}`}>{percent}%</span>
            <span className="font-ui text-[0.45rem] uppercase tracking-[0.1em] text-brand-muted">Ready</span>
          </div>
          <div>
            <h2 className="font-headline text-lg uppercase tracking-[0.1em] text-white">Church Readiness</h2>
            <p className="font-body text-sm text-brand-muted">How prepared you are to begin service today.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <CardButton onClick={onViewChecklist}>View Checklist</CardButton>
          <CardButton onClick={onRefresh} disabled={refreshing}>
            {refreshing ? "Checking…" : "Refresh Check"}
          </CardButton>
          <CardButton onClick={onFixIssues} primary>
            Fix Issues
          </CardButton>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {(Object.entries(readiness.sections) as [keyof LiveReadinessState["sections"], string][]).map(
          ([key, status]) => (
            <div key={key} className="rounded-lg border border-brand-border bg-brand-black/40 px-3 py-2">
              <p className="font-ui text-[0.5rem] uppercase tracking-[0.1em] text-brand-muted">
                {SECTION_LABELS[key]}
              </p>
              <p className={`font-ui text-xs font-semibold ${statusColorClass(status as never)}`}>
                {statusLabel(status as never)}
              </p>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

function CardButton({
  children,
  onClick,
  primary,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`touch-target rounded-lg px-3 py-2 font-ui text-[0.55rem] font-semibold uppercase tracking-[0.1em] ${
        primary ? "bg-brand-purple text-white" : "border border-brand-border text-brand-muted"
      }`}
    >
      {children}
    </button>
  );
}
