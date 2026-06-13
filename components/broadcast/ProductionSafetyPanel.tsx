"use client";

import { AlertOctagon, AlertTriangle, Ban, CheckCircle2 } from "lucide-react";
import { PARABLE_SHELL, PARABLE_STATUS } from "@/lib/broadcast/parable-tokens";
import type { HealthStatus, ProductionSafetyAction, ReadinessCheck } from "@/lib/broadcast/types";
import { HEALTH_STATUS_LABEL } from "@/lib/broadcast/types";

type ProductionSafetyPanelProps = {
  checks: ReadinessCheck[];
  safetyActions: ProductionSafetyAction[];
  onMitigation: (actionId: string) => void;
};

const STATUS_ICON: Record<HealthStatus, typeof CheckCircle2> = {
  green: CheckCircle2,
  yellow: AlertTriangle,
  orange: AlertOctagon,
  red: AlertOctagon,
  black: Ban,
};

function formatGuardianTime(iso: string | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export default function ProductionSafetyPanel({
  checks,
  safetyActions,
  onMitigation,
}: ProductionSafetyPanelProps) {
  const openChecks = checks.filter((c) => !c.passed);

  return (
    <section className="rounded-md border border-white/10 bg-[#111111] p-1.5">
      <p className={`font-ui text-[0.45rem] font-bold uppercase tracking-[0.14em] ${PARABLE_SHELL.muted}`}>
        Production Safety Engine
      </p>

      <ul className="mt-1 max-h-[96px] space-y-0.5 overflow-y-auto">
        {openChecks.length === 0 ? (
          <li
            className={`rounded border px-2 py-1 ${PARABLE_STATUS.green.border} ${PARABLE_STATUS.green.bg} ${PARABLE_STATUS.green.text}`}
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.06em]">All checks passing</p>
            </div>
          </li>
        ) : (
          openChecks.map((check) => {
            const severity = check.severity;
            const ui = PARABLE_STATUS[severity];
            const Icon = STATUS_ICON[severity];
            const canMitigate = !check.passed && !check.hardBlock && check.severity !== "black";

            return (
              <li key={check.id} className={`rounded border px-2 py-1 ${ui.border} ${ui.bg} ${ui.text}`}>
                <div className="flex items-start justify-between gap-1">
                  <div className="flex min-w-0 items-start gap-1">
                    <Icon className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate font-ui text-[0.48rem] font-bold uppercase tracking-[0.04em]">
                        {check.label}
                      </p>
                      <p className="mt-px truncate font-body text-[0.62rem] leading-snug opacity-90">
                        {check.message}
                      </p>
                      <p className="mt-px font-ui text-[0.42rem] font-bold uppercase tracking-[0.08em] opacity-75">
                        {HEALTH_STATUS_LABEL[check.severity]}
                        {check.hardBlock ? " · BLACK" : ""}
                      </p>
                    </div>
                  </div>
                  {canMitigate ? (
                    <button
                      type="button"
                      onClick={() => onMitigation(check.id)}
                      className={`touch-target shrink-0 rounded border px-1.5 py-0.5 font-ui text-[0.42rem] font-bold uppercase tracking-[0.06em] text-white ${PARABLE_SHELL.borderBlue} bg-[#0B090A]/80 hover:bg-[#1E40AF]/20`}
                    >
                      Log
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })
        )}
      </ul>

      {safetyActions.length > 0 ? (
        <div className="mt-1 border-t border-white/10 pt-1">
          <p className={`mb-0.5 font-ui text-[0.42rem] font-bold uppercase tracking-[0.12em] ${PARABLE_SHELL.muted}`}>
            Event Guardian · Human Approval Required
          </p>
          <ul className="max-h-[88px] space-y-0.5 overflow-y-auto">
            {safetyActions.map((action) => {
              const ui = PARABLE_STATUS[action.severity];
              const loggedAt = formatGuardianTime(action.timestamp);

              return (
                <li
                  key={action.id}
                  className={`rounded border px-2 py-1 ${ui.border} bg-[#0B090A]/70 ${ui.text}`}
                >
                  <p className="truncate font-ui text-[0.45rem] font-bold uppercase tracking-[0.04em]">
                    {action.title}
                  </p>
                  <p className="mt-px font-body text-[0.58rem] leading-snug text-white/85">
                    {action.issue ?? action.title}
                  </p>
                  <p className="mt-px font-body text-[0.58rem] text-white/75">{action.recommendation}</p>
                  {action.estimatedImpact ? (
                    <p className="mt-px font-ui text-[0.4rem] uppercase tracking-[0.06em] text-white/45">
                      Impact: {action.estimatedImpact}
                    </p>
                  ) : null}
                  {loggedAt ? (
                    <p className="mt-px font-ui text-[0.38rem] tabular-nums text-white/35">{loggedAt}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
