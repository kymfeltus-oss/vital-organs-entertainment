"use client";

import { PARABLE_SHELL, PARABLE_STATUS } from "@/lib/broadcast/parable-tokens";
import type { ProductionLogEntry } from "@/services/broadcast/ProductionLogService";

type ProductionAuditLogProps = {
  entries: ProductionLogEntry[];
  maxEntries?: number;
};

const PHASE_TONE: Record<
  ProductionLogEntry["phase"],
  (typeof PARABLE_STATUS)[keyof typeof PARABLE_STATUS]
> = {
  observe: PARABLE_STATUS.green,
  evaluate: PARABLE_STATUS.yellow,
  interlock: PARABLE_STATUS.orange,
  mitigate: PARABLE_STATUS.orange,
  command: PARABLE_STATUS.green,
  log: PARABLE_STATUS.green,
};

export default function ProductionAuditLog({
  entries,
  maxEntries = 8,
}: ProductionAuditLogProps) {
  const visible = entries.slice(0, maxEntries);

  return (
    <section className="rounded-lg border border-white/10 bg-[#111111] p-2.5">
      <p className={`font-ui text-[0.5rem] font-bold uppercase tracking-[0.16em] ${PARABLE_SHELL.muted}`}>
        Audit Log
      </p>

      {visible.length === 0 ? (
        <p className={`mt-2 font-ui text-[0.45rem] uppercase ${PARABLE_SHELL.muted}`}>No entries</p>
      ) : (
        <ul className="mt-2 max-h-[72px] space-y-1 overflow-y-auto">
          {visible.map((entry) => {
            const tone = PHASE_TONE[entry.phase] ?? PARABLE_STATUS.green;
            return (
              <li
                key={entry.id}
                className={`rounded-lg border px-3 py-2 ${tone.border} bg-[#0B090A]/80`}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={`font-ui text-[0.55rem] font-bold uppercase tracking-[0.14em] ${tone.text}`}>
                    {entry.phase}
                  </span>
                  <span className={`font-ui text-[0.55rem] uppercase tracking-[0.1em] ${PARABLE_SHELL.muted}`}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-1 font-body text-xs leading-relaxed text-white/85">
                  {entry.message}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
