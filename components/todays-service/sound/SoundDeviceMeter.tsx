"use client";

import type { SoundLevelsSnapshot } from "@/lib/sound/types";

type SoundDeviceMeterProps = {
  levels: SoundLevelsSnapshot | Record<string, unknown>;
  label?: string;
  className?: string;
};

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export default function SoundDeviceMeter({ levels, label = "Input level", className = "" }: SoundDeviceMeterProps) {
  const inputLevel = readNumber(levels.inputLevel);
  const peak = readNumber(levels.peak);
  const rms = readNumber(levels.rms);
  const clipping = Boolean(levels.clipping);
  const signalPresent = Boolean(levels.signalPresent);
  const meterId = "sound-meter-live";

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.08em] text-white/50">{label}</span>
        <span className="font-body text-xs text-white/65" aria-live="polite" aria-atomic="true">
          {signalPresent ? `${inputLevel.toFixed(0)}%` : "No signal"}
        </span>
      </div>
      <div
        id={meterId}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(inputLevel)}
        aria-label={`${label}. Peak ${peak} decibels. RMS ${rms} decibels.${clipping ? " Clipping detected." : ""}`}
        className="mt-2 h-3 overflow-hidden rounded-full border border-white/10 bg-black/60"
      >
        <div
          className={`h-full transition-[width] duration-150 ${clipping ? "bg-red-500" : signalPresent ? "bg-[#53fc18]" : "bg-white/20"}`}
          style={{ width: `${Math.max(4, Math.min(100, inputLevel))}%` }}
        />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 font-body text-[0.68rem] text-white/55">
        <span>Peak: {peak} dB</span>
        <span>RMS: {rms} dB</span>
        <span>{clipping ? "Clipping" : signalPresent ? "Signal present" : "Silent"}</span>
      </div>
    </div>
  );
}
