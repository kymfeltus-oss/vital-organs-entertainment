"use client";

import { MicOff } from "lucide-react";
import type { AudioChannel } from "@/lib/broadcast/types";
import { formatAudioDb } from "@/lib/ops/ops-stream-state";

type AudioMixerProps = {
  channels: AudioChannel[];
};

const SILENT_FLOOR = 4;

function isRestreamPullChannel(name: string): boolean {
  const lower = name.toLowerCase();
  return /cam\s*1|camera guy|restream pull/.test(lower);
}

function isSilentCamChannel(name: string, level: number): boolean {
  const lower = name.toLowerCase();
  const isCam34OrMedia = /cam\s*[34]|media\s*[12]/.test(lower);
  return isCam34OrMedia && level <= SILENT_FLOOR;
}

function VerticalMeter({ level, clipping }: { level: number; clipping: boolean }) {
  return (
    <div className="relative mx-auto h-28 w-2 overflow-hidden rounded-full bg-brand-black">
      <div
        className={`absolute bottom-0 w-full rounded-full transition-[height] duration-150 ${
          clipping ? "bg-brand-pink" : "bg-brand-blue"
        }`}
        style={{ height: `${Math.min(100, Math.max(4, level))}%` }}
      />
    </div>
  );
}

function ChannelStrip({ channel }: { channel: AudioChannel }) {
  const restreamPull = isRestreamPullChannel(channel.name);
  const silentLabel = isSilentCamChannel(channel.name, channel.meterLevel);
  const meterLabel = silentLabel ? "-∞ dB" : formatAudioDb(channel.meterLevel);

  return (
    <div
      className={`flex min-w-[72px] shrink-0 flex-col items-center rounded-xl border px-2 py-2 ${
        restreamPull
          ? "border-brand-pink/50 bg-brand-pink/5 shadow-[0_0_12px_rgba(255,47,175,0.12)]"
          : channel.clipping
            ? "border-brand-pink/40 bg-brand-pink/5"
            : "border-brand-border bg-brand-black"
      }`}
    >
      <VerticalMeter level={channel.meterLevel} clipping={channel.clipping} />
      <input
        type="range"
        min={0}
        max={100}
        value={channel.meterLevel}
        readOnly
        aria-label={`${channel.name} fader`}
        className="mt-2 h-24 w-2 cursor-default appearance-none bg-transparent [writing-mode:vertical-lr] direction-rtl accent-brand-blue opacity-80"
      />
      <p className="mt-2 max-w-full truncate text-center font-ui text-[0.42rem] font-bold uppercase text-white">
        {channel.name}
        {restreamPull ? (
          <span className="mt-0.5 block text-[0.34rem] text-brand-pink">Restream Pull</span>
        ) : null}
      </p>
      <p
        className={`font-ui text-[0.38rem] uppercase ${
          channel.clipping ? "text-brand-pink" : silentLabel ? "text-brand-muted" : "text-brand-muted"
        }`}
      >
        {meterLabel}
      </p>
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="mt-1 inline-flex cursor-not-allowed items-center gap-0.5 rounded border border-brand-border px-1 py-0.5 font-ui text-[0.34rem] uppercase text-brand-muted opacity-60"
      >
        <MicOff className="h-2.5 w-2.5" />
        Mute
      </button>
    </div>
  );
}

export default function AudioMixer({ channels }: AudioMixerProps) {
  return (
    <section
      aria-label="Sound module"
      className="flex min-h-0 flex-1 flex-col rounded-2xl border border-brand-border bg-brand-panel/50 p-2"
    >
      <div className="mb-2 px-1">
        <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.2em] text-brand-purple">
          Digital Audio Mixer
        </p>
        <p className="font-ui text-[0.48rem] text-brand-muted">
          Live meters · CAM 3 / CAM 4 show −∞ dB when silent
        </p>
      </div>

      {channels.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-4 text-center font-ui text-[0.48rem] uppercase text-brand-muted">
          No adapter audio meters
        </p>
      ) : (
        <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
          {channels.map((channel) => (
            <ChannelStrip key={channel.id} channel={channel} />
          ))}
        </div>
      )}
    </section>
  );
}
