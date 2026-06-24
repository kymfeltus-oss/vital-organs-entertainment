import { formatAudioDb } from "@/lib/ops/ops-stream-state";
import type { OpsStreamAudioLevels } from "@/lib/ops/ops-stream-state";

type AudioMonitorPanelProps = {
  audioLevels: OpsStreamAudioLevels | null;
};

type MeterChannel = {
  id: keyof OpsStreamAudioLevels;
  label: string;
};

const CHANNELS: MeterChannel[] = [
  { id: "master", label: "Master" },
  { id: "cam1", label: "CAM 1" },
  { id: "cam2", label: "CAM 2" },
  { id: "cam3", label: "CAM 3" },
  { id: "cam4", label: "CAM 4" },
  { id: "media1", label: "Media 1" },
  { id: "media2", label: "Media 2" },
];

function meterHeight(level: number): string {
  return `${Math.max(4, Math.min(100, level))}%`;
}

export default function AudioMonitorPanel({ audioLevels }: AudioMonitorPanelProps) {
  return (
    <section
      id="audio-monitor"
      className="glass-panel flex h-full flex-col rounded-2xl border border-brand-border p-4 md:p-5"
    >
      <header className="mb-4 border-b border-brand-border pb-3">
        <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-brand-purple">
          Audio Monitor
        </h2>
      </header>

      <div className="grid flex-1 grid-cols-7 gap-2 md:gap-3">
        {CHANNELS.map((channel) => {
          const level = audioLevels?.[channel.id] ?? null;
          const dbLabel = formatAudioDb(level);
          const height = level == null ? "4%" : meterHeight(level);

          return (
            <div key={channel.id} className="flex min-w-0 flex-col items-center gap-2">
              <div className="relative flex h-40 w-full items-end justify-center overflow-hidden rounded-lg border border-brand-border bg-brand-black/60 p-1 md:h-48">
                <div
                  className="w-full rounded-sm bg-gradient-to-t from-brand-blue via-brand-purple to-brand-pink transition-[height] duration-300 ease-out"
                  style={{ height }}
                  aria-hidden="true"
                />
              </div>
              <p className="font-ui text-[0.46rem] font-bold uppercase tracking-[0.1em] text-brand-muted">
                {channel.label}
              </p>
              <p className="font-mono text-[0.58rem] text-white">{dbLabel}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
