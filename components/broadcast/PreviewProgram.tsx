"use client";

import { Monitor, Radio, VideoOff } from "lucide-react";
import { PARABLE_SHELL, PARABLE_STATUS } from "@/lib/broadcast/parable-tokens";
import type { AudioChannel, BroadcastSource, ProductionState, TransitionType } from "@/lib/broadcast/types";

type PreviewProgramProps = {
  sources: BroadcastSource[];
  previewSourceId: string | null;
  programSourceId: string | null;
  production: ProductionState;
  isLive: boolean;
  audioChannels: AudioChannel[];
  onTransition: (type: TransitionType) => void;
};

function resolveMeterLevels(
  source: BroadcastSource | undefined,
  audioChannels: AudioChannel[],
): number[] {
  if (!source) return [0, 0, 0, 0, 0];
  const match = audioChannels.find((ch) =>
    ch.name.toLowerCase().includes(source.name.toLowerCase().slice(0, 6)),
  );
  const level = match?.meterLevel ?? source.signalStrength;
  return [level, level * 0.85, level * 0.7, level * 0.55, level * 0.4].map((v) =>
    Math.max(0, Math.min(100, Math.round(v))),
  );
}

function EdgeMeterStrip({ levels, accent }: { levels: number[]; accent: "blue" | "live" | "neutral" }) {
  const fill =
    accent === "live" ? "bg-red-400" : accent === "blue" ? "bg-[#1E40AF]" : "bg-white/20";

  return (
    <div className="absolute right-0 top-0 flex h-full gap-px border-l border-white/10 bg-[#0B090A]/80 px-0.5 py-1">
      {levels.map((level, index) => (
        <div key={index} className="relative w-1 overflow-hidden rounded-full bg-black/50" style={{ height: "100%" }}>
          <div className={`absolute bottom-0 w-full rounded-full ${fill}`} style={{ height: `${Math.max(level, 2)}%` }} />
        </div>
      ))}
    </div>
  );
}

function FeedPanel({
  label,
  source,
  variant,
  stingerActive,
  fadeProgress,
  isLive,
  audioChannels,
}: {
  label: string;
  source: BroadcastSource | undefined;
  variant: "preview" | "program";
  stingerActive: boolean;
  fadeProgress: number;
  isLive: boolean;
  audioChannels: AudioChannel[];
}) {
  const isProgram = variant === "program";
  const fadeOpacity = isProgram && fadeProgress > 0 && fadeProgress < 1 ? fadeProgress : 1;
  const meterLevels = resolveMeterLevels(source, audioChannels);

  const frameClass = isProgram
    ? isLive
      ? "border-2 border-red-500/55 shadow-[0_0_15px_rgba(239,68,68,0.25)] ring-1 ring-red-500/25"
      : "border-2 border-white/15"
    : "border-2 border-[#1E40AF]";

  return (
    <div className="relative flex h-full min-h-[240px] flex-col overflow-hidden rounded-md bg-[#111111]">
      <div className={`flex h-full flex-col overflow-hidden rounded-[calc(0.375rem-2px)] ${frameClass}`}>
        <div className="flex items-center justify-between border-b border-white/10 bg-[#0B090A]/70 px-2 py-1">
          <div className="flex items-center gap-1">
            {isProgram ? (
              <Radio className={`h-3 w-3 ${isLive ? PARABLE_STATUS.red.text : "text-white/35"}`} />
            ) : (
              <Monitor className="h-3 w-3 text-[#1E40AF]" />
            )}
            <span
              className={`font-ui font-bold uppercase tracking-[0.12em] ${
                isProgram ? "text-[0.6rem] text-white" : "text-[0.55rem] text-white/70"
              }`}
            >
              {label}
            </span>
          </div>
          {source ? (
            <span
              className={`rounded border px-1 py-px font-ui text-[0.42rem] font-bold uppercase ${
                source.online
                  ? `${PARABLE_STATUS.green.border} ${PARABLE_STATUS.green.bg} ${PARABLE_STATUS.green.text}`
                  : `${PARABLE_STATUS.red.border} ${PARABLE_STATUS.red.bg} ${PARABLE_STATUS.red.text}`
              }`}
            >
              {source.online ? "Online" : "Offline"}
            </span>
          ) : null}
        </div>

        <div
          className={`relative flex flex-1 bg-gradient-to-br pr-7 ${
            isProgram
              ? isLive
                ? "from-red-950/35 via-[#111111] to-[#0B090A]"
                : "from-[#111111] via-[#111111] to-[#0B090A]"
              : "from-[#1E40AF]/10 via-[#111111] to-[#0B090A]"
          }`}
          style={{ opacity: isProgram ? fadeOpacity : 0.78 }}
        >
          <EdgeMeterStrip
            levels={meterLevels}
            accent={isProgram ? (isLive ? "live" : "neutral") : "blue"}
          />

          {source ? (
            <>
              <div className="flex flex-1 flex-col items-center justify-center px-2 py-1 text-center">
                <p
                  className={`font-headline uppercase tracking-[0.12em] ${
                    isProgram
                      ? "text-[clamp(1.45rem,3vw,2.75rem)] text-white"
                      : "text-[clamp(0.9rem,1.35vw,1.2rem)] text-white/75"
                  }`}
                >
                  {source.name}
                </p>
                <p
                  className={`mt-1 font-ui uppercase tracking-[0.1em] ${
                    isProgram ? "text-[0.52rem] text-white/50" : "text-[0.48rem] text-white/38"
                  }`}
                >
                  {source.connectionType.toUpperCase()}
                  {source.vmixInputNumber ? ` · IN ${source.vmixInputNumber}` : ""} · {source.signalStrength}%
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-7 border-t border-white/10 bg-[#0B090A]/80 px-2 py-0.5 font-ui text-[0.42rem] uppercase tracking-[0.08em] text-white/40">
                {isProgram ? "Program Bus" : "Preview Bus"}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-3">
              <div className="rounded border border-dashed border-white/12 bg-[#0B090A]/70 px-4 py-3 text-center">
                <VideoOff className="mx-auto h-6 w-6 text-white/18" />
                <p className="mt-2 font-ui text-[0.5rem] font-bold uppercase tracking-[0.16em] text-white/35">
                  No Source Selected
                </p>
              </div>
            </div>
          )}

          {stingerActive && isProgram ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0B090A]/80">
              <p className={`font-headline text-2xl uppercase tracking-[0.2em] ${PARABLE_SHELL.accentMagenta}`}>
                Stinger
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const TRANSITIONS = [
  { id: "take", type: "fade" as TransitionType, label: "Take", primary: true },
  { id: "cut", type: "cut" as TransitionType, label: "Cut" },
  { id: "fade", type: "fade" as TransitionType, label: "Fade" },
  { id: "stinger", type: "stinger" as TransitionType, label: "Stinger" },
];

function HardwareSwitcher({ onTransition }: { onTransition: (type: TransitionType) => void }) {
  return (
    <div className="rounded-md border border-white/10 bg-[#111111] px-1.5 py-1">
      <div className="grid grid-cols-4 gap-1">
        {TRANSITIONS.map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => onTransition(btn.type)}
            className={`touch-target flex h-10 flex-col items-center justify-center rounded border font-ui transition ${
              btn.primary
                ? "border-[#B0267A]/70 bg-[#B0267A]/25 text-white hover:bg-[#B0267A]/35"
                : "border-white/12 bg-[#0B090A] text-white/85 hover:border-white/25 hover:bg-white/[0.03]"
            }`}
          >
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em]">{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PreviewProgram({
  sources,
  previewSourceId,
  programSourceId,
  production,
  isLive,
  audioChannels,
  onTransition,
}: PreviewProgramProps) {
  const preview = sources.find((s) => s.id === previewSourceId);
  const program = sources.find((s) => s.id === programSourceId);

  return (
    <section aria-label="Monitor matrix" className="flex flex-col gap-1">
      {/* Event-ready monitor sizing — frozen at 30/70 split */}
      <div className="grid grid-cols-[30fr_70fr] gap-1">
        <FeedPanel
          label="Preview"
          source={preview}
          variant="preview"
          stingerActive={production.stingerActive}
          fadeProgress={production.fadeProgress}
          isLive={isLive}
          audioChannels={audioChannels}
        />
        <FeedPanel
          label="Program Live"
          source={program}
          variant="program"
          stingerActive={production.stingerActive}
          fadeProgress={production.fadeProgress}
          isLive={isLive}
          audioChannels={audioChannels}
        />
      </div>
      <HardwareSwitcher onTransition={onTransition} />
    </section>
  );
}
