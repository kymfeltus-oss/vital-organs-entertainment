"use client";

import { MicOff, Shield } from "lucide-react";
import { PARABLE_SHELL, PARABLE_STATUS } from "@/lib/broadcast/parable-tokens";
import type { AudioChannel } from "@/lib/broadcast/types";

type AudioMixerProps = {
  channels: AudioChannel[];
};

function MiniMeter({ level, clipping }: { level: number; clipping: boolean }) {
  return (
    <div className="relative h-7 w-1 overflow-hidden rounded-full bg-black/50">
      <div
        className={`absolute bottom-0 w-full ${clipping ? "bg-[#B0267A]" : "bg-[#1E40AF]"}`}
        style={{ height: `${Math.min(100, Math.max(6, level))}%` }}
      />
    </div>
  );
}

export default function AudioMixer({ channels }: AudioMixerProps) {
  return (
    <div className="rounded-md border border-white/10 bg-[#111111] px-2 py-1">
      <div className="mb-1 flex items-center justify-between">
        <p className="font-ui text-[0.45rem] font-bold uppercase tracking-[0.12em] text-white/45">
          Audio Telemetry
        </p>
        <span className="font-ui text-[0.4rem] uppercase tracking-[0.08em] text-white/30">
          Telemetry Monitor Mode Only
        </span>
      </div>

      {channels.length === 0 ? (
        <p className={`py-1 text-center font-ui text-[0.45rem] uppercase ${PARABLE_SHELL.muted}`}>
          No adapter audio meters
        </p>
      ) : (
        <div className="flex gap-1 overflow-x-auto">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className={`flex min-w-[120px] shrink-0 flex-col rounded border px-1.5 py-1 ${
                channel.clipping ? "border-[#B0267A]/35" : "border-white/8"
              } bg-[#0B090A] opacity-90`}
            >
              <div className="flex items-end gap-1">
                <MiniMeter level={channel.meterLevel} clipping={channel.clipping} />
                <div className="min-w-0 flex-1 pb-0.5">
                  <p className="truncate font-ui text-[0.42rem] font-bold uppercase text-white/75">
                    {channel.name}
                  </p>
                  <p className={`font-ui text-[0.38rem] uppercase ${channel.clipping ? PARABLE_STATUS.red.text : "text-white/35"}`}>
                    {channel.meterLevel}%
                  </p>
                </div>
              </div>
              <div className="mt-1 flex gap-1">
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-0.5 rounded border border-white/10 px-1 py-0.5 font-ui text-[0.38rem] font-bold uppercase text-white/35 opacity-60"
                >
                  <MicOff className="h-2.5 w-2.5" />
                  Mute
                </button>
                <span className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-0.5 rounded border border-white/10 px-1 py-0.5 font-ui text-[0.34rem] font-bold uppercase leading-tight text-white/35 opacity-60">
                  <Shield className="h-2.5 w-2.5 shrink-0" />
                  Auto-Gain / Safety Leveler
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
