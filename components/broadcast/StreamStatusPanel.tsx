"use client";

import { PARABLE_SHELL, PARABLE_STATUS } from "@/lib/broadcast/parable-tokens";
import type { StreamDestinationTelemetry } from "@/lib/broadcast/types";

type StreamStatusPanelProps = {
  destinations: StreamDestinationTelemetry[];
  isLive: boolean;
  streamBitrateKbps: number;
  packetLossPercent: number;
  pipelineAvailable: boolean;
};

function displayDistributionName(dest: StreamDestinationTelemetry): string {
  const normalized = dest.name.trim().toLowerCase();
  if (dest.id === "restream" || normalized === "restream") {
    return "Distribution Relay";
  }
  return dest.name;
}

function resolveStateLabel(dest: StreamDestinationTelemetry): {
  label: string;
  tone: (typeof PARABLE_STATUS)[keyof typeof PARABLE_STATUS];
} {
  if (dest.live) return { label: "Live", tone: PARABLE_STATUS.red };
  if (dest.connected) return { label: "Connected", tone: PARABLE_STATUS.green };
  return { label: "Offline", tone: PARABLE_STATUS.red };
}

export default function StreamStatusPanel({
  destinations,
  isLive,
  streamBitrateKbps,
  packetLossPercent,
  pipelineAvailable,
}: StreamStatusPanelProps) {
  return (
    <section className="rounded-md border border-white/10 bg-[#111111] p-1.5">
      <div className="mb-0.5 flex items-center justify-between gap-1">
        <p className={`font-ui text-[0.45rem] font-bold uppercase tracking-[0.14em] ${PARABLE_SHELL.muted}`}>
          Distribution Network
        </p>
        <span className="font-ui text-[0.38rem] uppercase text-white/38">
          {isLive ? "Live" : "Standby"}
          {streamBitrateKbps > 0 ? ` · ${streamBitrateKbps}k` : ""}
          {packetLossPercent > 0 ? ` · ${packetLossPercent.toFixed(1)}% loss` : ""}
        </span>
      </div>

      {!pipelineAvailable ? (
        <p className={`mb-0.5 rounded border border-white/10 px-1 py-0.5 font-ui text-[0.38rem] uppercase ${PARABLE_SHELL.muted}`}>
          Pipeline unavailable
        </p>
      ) : null}

      {destinations.length === 0 ? (
        <p className={`rounded border border-dashed border-white/10 px-1 py-0.5 text-center font-ui text-[0.38rem] uppercase ${PARABLE_SHELL.muted}`}>
          No distribution endpoints
        </p>
      ) : (
        <div className="max-h-[68px] space-y-0.5 overflow-y-auto">
          {destinations.map((dest) => {
            const state = resolveStateLabel(dest);

            return (
              <div
                key={dest.id}
                className={`rounded border px-1.5 py-0.5 ${
                  dest.live
                    ? `${PARABLE_STATUS.red.border} bg-[#0B090A]`
                    : dest.connected
                      ? "border-[#1E40AF]/28 bg-[#0B090A]/90"
                      : "border-white/8 bg-[#0B090A]/70"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <p className="truncate font-card-title text-[0.5rem] uppercase tracking-wide text-white">
                    {displayDistributionName(dest)}
                  </p>
                  <span
                    className={`shrink-0 rounded border px-1 py-px font-ui text-[0.36rem] font-bold uppercase ${state.tone.border} ${state.tone.bg} ${state.tone.text}`}
                  >
                    {state.label}
                  </span>
                </div>
                <div className="mt-px flex flex-wrap gap-1.5 font-ui text-[0.36rem] uppercase tracking-[0.06em] text-white/40">
                  {dest.bitrateKbps > 0 ? <span>{dest.bitrateKbps} kbps</span> : null}
                  {dest.droppedFrames > 0 ? (
                    <span className={PARABLE_STATUS.orange.text}>{dest.droppedFrames} drops</span>
                  ) : null}
                  {packetLossPercent > 0 && dest.connected ? (
                    <span className={PARABLE_STATUS.orange.text}>{packetLossPercent.toFixed(1)}% pkt</span>
                  ) : null}
                </div>
                {dest.error ? (
                  <p className={`mt-px truncate font-body text-[0.5rem] ${PARABLE_STATUS.orange.text}`}>
                    {dest.error}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
