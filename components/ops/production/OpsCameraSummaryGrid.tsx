"use client";

import type { OpsSnapshot } from "@/lib/ops/types";

type OpsCameraSummaryGridProps = {
  stream: OpsSnapshot["stream"] | null;
};

export default function OpsCameraSummaryGrid({ stream }: OpsCameraSummaryGridProps) {
  const cells = [
    {
      label: "Active Source",
      value: stream?.activeSource ?? "offline",
    },
    {
      label: "Engine",
      value: stream?.studioEngineMode ?? "—",
    },
    {
      label: "Ingest",
      value: stream?.primaryRtmpConfigured ? "Configured" : "Missing",
    },
    {
      label: "Preview HLS",
      value: stream?.cameraPreviewConfigured ? "Ready" : "Missing",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="glass-panel rounded-xl border border-brand-border p-3 text-center"
        >
          <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
            {cell.label}
          </p>
          <p className="mt-2 font-ui text-[0.62rem] font-bold uppercase text-white">{cell.value}</p>
        </div>
      ))}
    </div>
  );
}
