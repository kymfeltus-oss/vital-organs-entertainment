"use client";

import { useEffect, useRef } from "react";
import { PARABLE_SHELL, PARABLE_STATUS } from "@/lib/broadcast/parable-tokens";
import type { HealthStatus, ProductionLogEntry } from "@/lib/broadcast/types";

type ProductionEventsPanelProps = {
  entries: ProductionLogEntry[];
};

const SEVERITY_TONE: Record<
  HealthStatus,
  (typeof PARABLE_STATUS)[keyof typeof PARABLE_STATUS]
> = {
  green: PARABLE_STATUS.green,
  yellow: PARABLE_STATUS.yellow,
  orange: PARABLE_STATUS.yellow,
  red: PARABLE_STATUS.red,
  black: PARABLE_STATUS.black,
};

const SEVERITY_CATEGORY: Record<HealthStatus, string> = {
  green: "Info",
  yellow: "Warning",
  orange: "Warning",
  red: "Critical",
  black: "Hard Block",
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export default function ProductionEventsPanel({ entries }: ProductionEventsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const newestId = entries[0]?.id ?? null;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
  }, [newestId, entries.length]);

  return (
    <section
      className="flex min-h-[120px] flex-1 flex-col overflow-hidden rounded-md border border-white/10 bg-[#111111]"
      aria-label="Production events"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-2 py-0.5">
        <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.14em] text-white/50">
          Production Events
        </p>
        <span className="font-ui text-[0.42rem] uppercase tracking-[0.08em] text-white/30">
          {entries.length} logged
        </span>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1">
        {entries.length === 0 ? (
          <p className={`py-2 text-center font-ui text-[0.48rem] uppercase tracking-[0.1em] ${PARABLE_SHELL.muted}`}>
            No production events logged
          </p>
        ) : (
          <ul className="space-y-1">
            {entries.map((entry, index) => {
              const tone = SEVERITY_TONE[entry.severity] ?? PARABLE_STATUS.green;
              const category = SEVERITY_CATEGORY[entry.severity] ?? "Info";
              const rowShade = index % 2 === 0 ? "bg-[#0B090A]/85" : "bg-white/[0.025]";

              return (
                <li
                  key={entry.id}
                  className={`rounded border-l-2 px-2 py-1.5 ${rowShade} ${tone.border} border-l-current`}
                >
                  <time
                    dateTime={entry.timestamp}
                    className="block font-ui text-[0.52rem] tabular-nums text-white/55"
                  >
                    {formatTimestamp(entry.timestamp)}
                  </time>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span
                      className={`shrink-0 rounded border px-1.5 py-0.5 font-ui text-[0.42rem] font-bold uppercase tracking-[0.06em] ${tone.border} ${tone.bg} ${tone.text}`}
                    >
                      {category}
                    </span>
                    <p className="min-w-0 font-body text-[0.7rem] leading-snug text-white/90">{entry.message}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
