"use client";

import { Monitor, Radio, Scissors, VideoOff, Zap } from "lucide-react";
import RestreamPipelineStrip from "@/components/broadcast/RestreamPipelineStrip";
import RestreamStatusStrip from "@/components/broadcast/RestreamStatusStrip";
import { technicalVideoHint, videoQualityLabel } from "@/lib/broadcast/layman-copy";
import type { OpsStreamState } from "@/lib/ops/ops-stream-state";
import type { OpsSnapshot } from "@/lib/ops/types";
import type { AudioChannel, BroadcastSource, ProductionState, TransitionType } from "@/lib/broadcast/types";

type MixingConsoleProps = {
  sources: BroadcastSource[];
  previewSourceId: string | null;
  programSourceId: string | null;
  production: ProductionState;
  sandboxIsLive: boolean;
  platformIsLive: boolean;
  opsStream: OpsSnapshot["stream"] | null;
  opsState: OpsStreamState | null;
  audioChannels: AudioChannel[];
  readinessScore: number;
  canGoLive: boolean;
  rehearsalMode: boolean;
  pushConfigured: boolean;
  pullConfigured: boolean;
  previewConfigured: boolean;
  onOpenRestreamConfig: () => void;
  onTransition: (type: TransitionType) => void;
  onGoLive: () => void;
  onEndLive: () => void;
};

function resolveMeterLevels(
  source: BroadcastSource | undefined,
  audioChannels: AudioChannel[],
  audioLevels?: OpsStreamState["audioLevels"],
  sourceIndex?: number,
): number[] {
  if (audioLevels && sourceIndex === 0) {
    const level = audioLevels.cam1;
    return [level, level * 0.85, level * 0.7, level * 0.55, level * 0.4].map((v) =>
      Math.max(0, Math.min(100, Math.round(v))),
    );
  }

  if (!source) return [0, 0, 0, 0, 0];
  const match = audioChannels.find((ch) =>
    ch.name.toLowerCase().includes(source.name.toLowerCase().slice(0, 6)),
  );
  const level = match?.meterLevel ?? source.signalStrength;
  return [level, level * 0.85, level * 0.7, level * 0.55, level * 0.4].map((v) =>
    Math.max(0, Math.min(100, Math.round(v))),
  );
}

function EdgeMeterStrip({
  levels,
  accent,
}: {
  levels: number[];
  accent: "blue" | "live" | "neutral";
}) {
  const fill =
    accent === "live" ? "bg-brand-pink" : accent === "blue" ? "bg-brand-blue" : "bg-white/20";

  return (
    <div className="absolute right-0 top-0 flex h-full gap-px border-l border-brand-border bg-brand-black/80 px-0.5 py-1">
      {levels.map((level, index) => (
        <div
          key={index}
          className="relative w-1 overflow-hidden rounded-full bg-black/50"
          style={{ height: "100%" }}
        >
          <div
            className={`absolute bottom-0 w-full rounded-full ${fill}`}
            style={{ height: `${Math.max(level, 2)}%` }}
          />
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
  audioLevels,
  highlightRestreamPull,
}: {
  label: string;
  source: BroadcastSource | undefined;
  variant: "preview" | "program";
  stingerActive: boolean;
  fadeProgress: number;
  isLive: boolean;
  audioChannels: AudioChannel[];
  audioLevels?: OpsStreamState["audioLevels"];
  highlightRestreamPull?: boolean;
}) {
  const isProgram = variant === "program";
  const fadeOpacity = isProgram && fadeProgress > 0 && fadeProgress < 1 ? fadeProgress : 1;
  const meterLevels = resolveMeterLevels(source, audioChannels, audioLevels, highlightRestreamPull ? 0 : undefined);

  const frameClass = isProgram
    ? isLive
      ? "border-2 border-brand-pink/55 shadow-[0_0_15px_rgba(255,47,175,0.25)] ring-1 ring-brand-pink/25"
      : "border-2 border-brand-border"
    : "border-2 border-brand-blue/50";

  return (
    <div className="relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-xl bg-brand-panel">
      <div className={`flex h-full flex-col overflow-hidden rounded-[calc(0.75rem-2px)] ${frameClass}`}>
        <div className="flex items-center justify-between border-b border-brand-border bg-brand-black/70 px-3 py-1.5">
          <div className="flex items-center gap-1.5">
            {isProgram ? (
              <Radio className={`h-3.5 w-3.5 ${isLive ? "text-brand-pink" : "text-brand-muted"}`} />
            ) : (
              <Monitor className="h-3.5 w-3.5 text-brand-blue" />
            )}
            <span className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
              {label}
            </span>
          </div>
          {source ? (
            <span
              className={`rounded border px-1.5 py-px font-ui text-[0.45rem] font-bold uppercase ${
                source.online
                  ? "border-brand-blue/40 bg-brand-blue/15 text-brand-blue"
                  : "border-brand-pink/40 bg-brand-pink/10 text-brand-pink"
              }`}
            >
              {source.online ? "Connected" : "Not Connected"}
            </span>
          ) : null}
        </div>

        <div
          className={`relative flex flex-1 pr-7 ${
            isProgram
              ? isLive
                ? "bg-gradient-to-br from-brand-pink/10 via-brand-panel to-brand-black"
                : "bg-brand-panel"
              : "bg-gradient-to-br from-brand-blue/10 via-brand-panel to-brand-black"
          }`}
          style={{ opacity: isProgram ? fadeOpacity : 0.88 }}
        >
          <EdgeMeterStrip
            levels={meterLevels}
            accent={isProgram ? (isLive ? "live" : "neutral") : "blue"}
          />

          {source ? (
            <div className="flex flex-1 flex-col items-center justify-center px-3 py-2 text-center">
              <p
                className={`font-headline uppercase tracking-[0.12em] ${
                  isProgram
                    ? "text-[clamp(1.25rem,2.5vw,2.25rem)] text-white"
                    : "text-[clamp(0.85rem,1.2vw,1.1rem)] text-brand-muted"
                }`}
              >
                {source.name}
              </p>
              <p
                className="mt-1 font-ui text-[0.5rem] uppercase tracking-[0.1em] text-brand-muted"
                title={technicalVideoHint(
                  source.connectionType,
                  source.signalStrength,
                  source.vmixInputNumber,
                )}
              >
                {videoQualityLabel(source.signalStrength)}
              </p>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-4">
              <div className="rounded-xl border border-dashed border-brand-border bg-brand-black/70 px-4 py-3 text-center">
                <VideoOff className="mx-auto h-6 w-6 text-brand-muted" />
                <p className="mt-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
                  No Camera Selected Yet
                </p>
              </div>
            </div>
          )}

          {stingerActive && isProgram ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-brand-black/80">
              <p className="font-headline text-2xl uppercase tracking-[0.2em] text-brand-purple">
                Graphic Transition
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TransitionColumn({ onTransition }: { onTransition: (type: TransitionType) => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-1">
      <button
        type="button"
        onClick={() => onTransition("cut")}
        className="touch-target flex h-14 w-full min-w-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl border border-brand-border bg-brand-panel font-ui text-[0.55rem] font-bold uppercase tracking-[0.1em] text-white transition hover:border-brand-blue/40 hover:bg-brand-blue/10"
      >
        <Scissors className="h-4 w-4 text-brand-blue" aria-hidden="true" />
        Instant Switch
      </button>
      <button
        type="button"
        onClick={() => onTransition("fade")}
        className="touch-target flex h-14 w-full min-w-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl border border-brand-purple/40 bg-brand-purple/10 font-ui text-[0.55rem] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-brand-purple/20"
      >
        <Zap className="h-4 w-4 text-brand-purple" aria-hidden="true" />
        Smooth Fade
      </button>
    </div>
  );
}

export default function MixingConsole({
  sources,
  previewSourceId,
  programSourceId,
  production,
  sandboxIsLive,
  platformIsLive,
  opsStream,
  opsState,
  audioChannels,
  readinessScore,
  canGoLive,
  rehearsalMode,
  pushConfigured,
  pullConfigured,
  previewConfigured,
  onOpenRestreamConfig,
  onTransition,
  onGoLive,
  onEndLive,
}: MixingConsoleProps) {
  const preview = sources.find((s) => s.id === previewSourceId);
  const program = sources.find((s) => s.id === programSourceId);
  const programLive = sandboxIsLive || platformIsLive;
  const engineMode = opsStream?.studioEngineMode ?? opsState?.studioEngineMode ?? "restream_api";
  const audioLevels = opsState?.audioLevels;

  return (
    <section
      aria-label="Mixing module"
      className="flex min-h-0 flex-[1.15] flex-col gap-2 rounded-2xl border border-brand-border bg-brand-panel/50 p-2"
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <div>
          <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.2em] text-brand-blue">
            Video Mixer
          </p>
          <p className="font-ui text-[0.48rem] text-brand-muted">
            Ready score {readinessScore}
            {platformIsLive ? " · Viewers are watching" : ""}
          </p>
        </div>
        {!programLive ? (
          <button
            type="button"
            disabled={!canGoLive}
            onClick={onGoLive}
            className="touch-target rounded-full border border-brand-pink/60 bg-brand-pink/20 px-6 py-2.5 font-ui text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_20px_rgba(255,47,175,0.25)] transition hover:bg-brand-pink/30 disabled:opacity-40"
          >
            {rehearsalMode ? "Practice Go Live" : "🚀 Click to Start the Show"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onEndLive}
            className="touch-target rounded-full border border-brand-pink/50 bg-brand-black px-6 py-2.5 font-ui text-[0.65rem] font-bold uppercase tracking-[0.14em] text-brand-pink transition hover:bg-brand-pink/10"
          >
            {rehearsalMode ? "End Practice" : "Stop the Show"}
          </button>
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_auto_1fr] gap-2">
        <FeedPanel
          label="Up Next"
          source={preview}
          variant="preview"
          stingerActive={production.stingerActive}
          fadeProgress={production.fadeProgress}
          isLive={programLive}
          audioChannels={audioChannels}
          audioLevels={audioLevels}
        />
        <TransitionColumn onTransition={onTransition} />
        <div className="flex min-h-0 flex-col gap-2">
          <FeedPanel
            label="On Air (What Viewers See)"
            source={program}
            variant="program"
            stingerActive={production.stingerActive}
            fadeProgress={production.fadeProgress}
            isLive={programLive}
            audioChannels={audioChannels}
            audioLevels={audioLevels}
            highlightRestreamPull={engineMode === "restream_api"}
          />
          <RestreamStatusStrip
            engineMode={engineMode}
            activeSource={
              opsStream?.activeSource === "backup"
                ? "backup"
                : opsStream?.activeSource === "primary"
                  ? "primary"
                  : "offline"
            }
            opsStream={opsState}
          />
        </div>
      </div>

      <RestreamPipelineStrip
        pushConfigured={pushConfigured}
        pullConfigured={pullConfigured}
        previewConfigured={previewConfigured}
        platformIsLive={platformIsLive}
        onOpenConfig={onOpenRestreamConfig}
      />
    </section>
  );
}
