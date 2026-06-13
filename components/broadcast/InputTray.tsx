"use client";

import { Plus } from "lucide-react";
import { resolveSourceCardStatus } from "@/lib/broadcast/readinessEngine";
import { PARABLE_SHELL, PARABLE_STATUS } from "@/lib/broadcast/parable-tokens";
import type { BroadcastSource, SourceCardStatus } from "@/lib/broadcast/types";

type InputTrayProps = {
  sources: BroadcastSource[];
  previewSourceId: string | null;
  programSourceId: string | null;
  onSelectPreview: (sourceId: string) => void;
  emptyLabel?: string;
};

const STATUS_STYLES: Record<
  SourceCardStatus,
  { label: string; border: string; badge: string; numberBg: string; glow: string; hover: string }
> = {
  active: {
    label: "PGM",
    border: "border-[#B0267A]/65",
    badge:
      "border-[#B0267A]/60 bg-[#B0267A]/28 text-[#B0267A] shadow-[0_0_8px_rgba(176,38,122,0.35)] ring-1 ring-[#B0267A]/25",
    numberBg: "bg-[#B0267A]/25 text-[#B0267A] ring-1 ring-[#B0267A]/20",
    glow: "shadow-[0_0_14px_rgba(176,38,122,0.28)]",
    hover: "hover:border-[#B0267A]/80 hover:shadow-[0_0_16px_rgba(176,38,122,0.32)]",
  },
  preview: {
    label: "PVW",
    border: "border-[#1E40AF]/65",
    badge:
      "border-[#1E40AF]/55 bg-[#1E40AF]/22 text-[#1E40AF] shadow-[0_0_8px_rgba(30,64,175,0.3)] ring-1 ring-[#1E40AF]/20",
    numberBg: "bg-[#1E40AF]/22 text-[#1E40AF] ring-1 ring-[#1E40AF]/18",
    glow: "shadow-[0_0_14px_rgba(30,64,175,0.26)]",
    hover: "hover:border-[#1E40AF]/80 hover:shadow-[0_0_16px_rgba(30,64,175,0.3)]",
  },
  idle: {
    label: "—",
    border: "border-white/10",
    badge: "border-white/10 bg-white/5 text-white/50",
    numberBg: "bg-[#111111] text-white/40",
    glow: "",
    hover: "hover:border-white/25 hover:bg-white/[0.03]",
  },
  offline: {
    label: "OFF",
    border: "border-white/8 opacity-50",
    badge: `${PARABLE_STATUS.red.border} ${PARABLE_STATUS.red.bg} ${PARABLE_STATUS.red.text}`,
    numberBg: "bg-[#0B090A] text-white/25",
    glow: "",
    hover: "",
  },
};

export default function InputTray({
  sources,
  previewSourceId,
  programSourceId,
  onSelectPreview,
  emptyLabel,
}: InputTrayProps) {
  return (
    <section className="rounded-md border border-white/10 bg-[#111111]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-2 py-0.5">
        <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.14em] text-white/50">
          Media Sources · {sources.length}
        </p>
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Telemetry Monitor Mode Only — Phase 2C adapter wiring pending"
          className="inline-flex cursor-not-allowed items-center gap-1 rounded border border-white/10 bg-[#0B090A] px-1.5 py-0.5 font-ui text-[0.45rem] font-bold uppercase tracking-[0.08em] text-white/35 opacity-60"
        >
          <Plus className="h-2.5 w-2.5" aria-hidden="true" />
          Add Source
        </button>
      </div>

      {sources.length === 0 ? (
        <p className={`px-2 py-1.5 font-ui text-[0.48rem] uppercase tracking-[0.1em] ${PARABLE_SHELL.muted}`}>
          {emptyLabel ?? "No hardware connected — awaiting adapter"}
        </p>
      ) : (
        <div className="overflow-x-auto px-1 py-0.5">
          <div className="flex min-w-min gap-0.5">
            {sources.map((source, index) => {
              const status = resolveSourceCardStatus(
                source.id,
                previewSourceId,
                programSourceId,
                source.online,
              );
              const styles = STATUS_STYLES[status];
              const isActive = status === "active" || status === "preview";

              return (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => source.online && onSelectPreview(source.id)}
                  disabled={!source.online}
                  className={`touch-target w-[9.75rem] shrink-0 rounded border bg-[#0B090A] p-1 text-left transition disabled:cursor-not-allowed ${styles.border} ${styles.glow} ${styles.hover}`}
                >
                  <div className="mb-0.5 flex items-center justify-between gap-0.5">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded font-headline text-[0.95rem] leading-none ${styles.numberBg}`}
                    >
                      {index + 1}
                    </span>
                    <span
                      className={`rounded border px-2 py-0.5 font-ui text-[0.52rem] font-bold uppercase tracking-[0.05em] ${styles.badge}`}
                    >
                      {styles.label}
                    </span>
                  </div>
                  <p className="truncate font-card-title text-[0.6rem] uppercase leading-tight text-white">
                    {source.name}
                  </p>
                  <div className="mt-0.5 flex flex-wrap gap-x-1 font-ui text-[0.36rem] uppercase text-white/38">
                    <span>{source.connectionType}</span>
                    {source.vmixInputNumber ? <span>IN {source.vmixInputNumber}</span> : null}
                    <span className={source.online ? PARABLE_STATUS.green.text : PARABLE_STATUS.red.text}>
                      {source.online ? "Online" : "Offline"}
                    </span>
                  </div>
                  {isActive ? (
                    <p className="mt-0.5 font-ui text-[0.36rem] font-bold uppercase tracking-[0.08em] text-white/55">
                      {status === "active" ? "On Program" : "On Preview"}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
