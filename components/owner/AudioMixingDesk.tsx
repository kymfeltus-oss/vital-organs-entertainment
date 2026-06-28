"use client";

import {
  CONCERT_EQ_PRESET_LABELS,
  type ConcertEqPreset,
  type OwnerAudioConfig,
} from "@/lib/owner/audio-contracts";

type AudioMixingDeskProps = {
  config: OwnerAudioConfig;
  configPending?: boolean;
  onConfigChange: (patch: Partial<OwnerAudioConfig>) => void;
};

const EQ_PRESETS: ConcertEqPreset[] = ["spoken_word", "full_choir", "acoustic_prayer"];

function RackModule({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function VerticalSlider({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col items-center gap-3">
      <span className="font-ui text-[0.55rem] font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        onInput={(event) => onChange(Number((event.target as HTMLInputElement).value))}
        className="h-36 w-8 [writing-mode:vertical-lr] [direction:rtl] accent-sky-400 disabled:opacity-40"
      />
      <span className="font-body text-xs tabular-nums text-slate-300">{value}%</span>
    </label>
  );
}

function RotaryKnob({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const rotation = -135 + (value / 100) * 270;

  return (
    <label className="flex flex-col items-center gap-3">
      <span className="text-center font-ui text-[0.55rem] font-bold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </span>
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-slate-700 bg-slate-950 shadow-inner" />
        <div
          className="absolute h-8 w-1 origin-bottom rounded-full bg-sky-400"
          style={{ transform: `rotate(${rotation}deg) translateY(-18px)` }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          onInput={(event) => onChange(Number((event.target as HTMLInputElement).value))}
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          aria-label={label}
        />
      </div>
      <span className="font-body text-xs tabular-nums text-slate-300">{value}%</span>
    </label>
  );
}

export default function AudioMixingDesk({
  config,
  configPending = false,
  onConfigChange,
}: AudioMixingDeskProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 p-4 md:max-w-4xl sm:p-6">
      <header className="border-b border-slate-800 pb-4">
        <p className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-sky-400">
          Mastering Desk
        </p>
        <h1 className="font-headline text-2xl uppercase tracking-[0.08em] text-slate-50">
          Post-Production FX Rack
        </h1>
        <p className="mt-2 font-body text-sm text-slate-400">
          Configuration-only — filters apply on the dedicated media node via API callbacks.
        </p>
      </header>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <RackModule title="White Noise Suppressor">
          <div className="flex justify-center">
            <RotaryKnob
              label="Suppress"
              value={config.whiteNoiseSuppressor}
              disabled={configPending}
              onChange={(whiteNoiseSuppressor) => onConfigChange({ whiteNoiseSuppressor })}
            />
          </div>
        </RackModule>

        <RackModule title="Concert EQ Presets">
          <div className="grid gap-2 sm:grid-cols-3">
            {EQ_PRESETS.map((preset) => {
              const active = config.concertEqPreset === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  disabled={configPending}
                  onClick={() => onConfigChange({ concertEqPreset: preset })}
                  className={`min-h-14 rounded-lg border px-3 py-3 font-ui text-[0.62rem] font-bold uppercase tracking-[0.08em] transition-colors disabled:opacity-40 ${
                    active
                      ? "border-sky-500/50 bg-sky-500/15 text-sky-200"
                      : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                  }`}
                >
                  {CONCERT_EQ_PRESET_LABELS[preset]}
                </button>
              );
            })}
          </div>
        </RackModule>

        <RackModule title="Master Broadcast Limiter Compressor">
          <div className="flex justify-center">
            <VerticalSlider
              label="Ceiling"
              value={config.masterLimiterCompressor}
              disabled={configPending}
              onChange={(masterLimiterCompressor) => onConfigChange({ masterLimiterCompressor })}
            />
          </div>
          <p className="mt-4 text-center font-body text-xs text-slate-500">
            Backend brick-wall limiter threshold for the outbound program mix.
          </p>
        </RackModule>
      </div>
    </div>
  );
}
