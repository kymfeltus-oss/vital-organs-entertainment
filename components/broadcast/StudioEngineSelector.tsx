"use client";

import { CloudLightning, Cpu, Loader2 } from "lucide-react";
import type { StudioEngineMode } from "@/lib/ops/studio-engine-mode";

type StudioEngineSelectorProps = {
  value: StudioEngineMode;
  canEdit: boolean;
  isSaving: boolean;
  onChange: (mode: StudioEngineMode) => void;
};

const TILES: Array<{
  mode: StudioEngineMode;
  title: string;
  subtitle: string;
  icon: typeof Cpu;
  activeBorder: string;
  activeGlow: string;
}> = [
  {
    mode: "internal_studio",
    title: "🏠 Run Inside App",
    subtitle: "Best for local webcams and phones",
    icon: Cpu,
    activeBorder: "border-brand-purple",
    activeGlow: "shadow-[0_0_20px_rgba(138,46,255,0.35)]",
  },
  {
    mode: "restream_api",
    title: "☁️ Run Through Cloud",
    subtitle: "Best for big events and external cameras",
    icon: CloudLightning,
    activeBorder: "border-brand-pink",
    activeGlow: "shadow-[0_0_20px_rgba(255,47,175,0.3)]",
  },
];

export default function StudioEngineSelector({
  value,
  canEdit,
  isSaving,
  onChange,
}: StudioEngineSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="font-ui text-[0.55rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
          How should video reach viewers?
        </p>
        {isSaving ? (
          <span className="inline-flex items-center gap-1 font-ui text-[0.48rem] uppercase text-brand-blue">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            Saving
          </span>
        ) : null}
      </div>

      <div
        role="radiogroup"
        aria-label="Studio engine mode"
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      >
        {TILES.map((tile) => {
          const Icon = tile.icon;
          const active = value === tile.mode;

          return (
            <button
              key={tile.mode}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={!canEdit || isSaving}
              onClick={() => onChange(tile.mode)}
              className={`touch-target rounded-xl border bg-zinc-900 p-3 text-left transition ${
                active
                  ? `${tile.activeBorder} ${tile.activeGlow} ring-1 ring-white/10`
                  : "border-brand-border hover:border-brand-muted/40"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    active ? "bg-brand-black" : "bg-brand-black/60"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${active ? "text-white" : "text-brand-muted"}`}
                    aria-hidden="true"
                  />
                </span>
                <span className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.1em] text-white">
                  {tile.title}
                </span>
              </div>
              <p className="font-body text-[0.58rem] leading-relaxed text-brand-muted">
                {tile.subtitle}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
