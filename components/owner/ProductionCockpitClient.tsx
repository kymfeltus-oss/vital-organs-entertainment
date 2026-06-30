"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Loader2,
  Lock,
  MonitorDot,
  Play,
  Radio,
  RefreshCw,
  Square,
  Timer,
  Zap,
} from "lucide-react";
import {
  formatGraphicsTypeLabel,
  type OwnerGraphicsPreset,
  type OwnerGraphicsTheme,
  OWNER_GRAPHICS_DEFAULT_THEME,
  OWNER_GRAPHICS_EVENT_ID,
} from "@/lib/owner/graphics-data-plane";
import type { OwnerAudioTelemetry } from "@/lib/owner/audio-contracts";
import { getSupabase } from "@/lib/supabase/client";

type ApiPresetResponse = {
  success: boolean;
  presets?: OwnerGraphicsPreset[];
  preset?: OwnerGraphicsPreset;
  clearedCount?: number;
  error?: string;
  message?: string;
};

type ApiThemeResponse = {
  success: boolean;
  theme?: OwnerGraphicsTheme;
  error?: string;
};

type RuntimeTimer = {
  startedAt: number;
  durationSeconds: number;
};

type BroadcastResponse = {
  blocked?: boolean;
  ok?: boolean;
  message?: string;
  error?: string;
};

type DestinationKey = "youtube" | "facebook" | "twitch";

type RestreamDestinations = Record<DestinationKey, boolean>;

type ShowSetupResponse = {
  ok?: boolean;
  state?: {
    showTitle?: string;
    presenterName?: string;
    targetDateTime?: string;
    restreamDestinations?: Partial<RestreamDestinations>;
  };
  message?: string;
  error?: string;
};

type AudioMixStateResponse = {
  ok?: boolean;
  success?: boolean;
  telemetry?: OwnerAudioTelemetry;
  error?: string;
};

const DEFAULT_RESTREAM_DESTINATIONS: RestreamDestinations = {
  youtube: true,
  facebook: true,
  twitch: true,
};

const DB_STEPS = [0, -6, -12, -18, -24, -30, -36, -42, -48, -54, -60];

function sortPresets(presets: OwnerGraphicsPreset[]) {
  return [...presets].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

function mergePreset(current: OwnerGraphicsPreset[], nextPreset: OwnerGraphicsPreset) {
  const exists = current.some((preset) => preset.id === nextPreset.id);
  if (!exists) return sortPresets([nextPreset, ...current]);
  return sortPresets(current.map((preset) => (preset.id === nextPreset.id ? nextPreset : preset)));
}

function removePreset(current: OwnerGraphicsPreset[], id: string) {
  return current.filter((preset) => preset.id !== id);
}

function getCountdownParts(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(safeSeconds / 86_400);
  const hours = Math.floor((safeSeconds % 86_400) / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return {
    days,
    hours,
    minutes,
    seconds,
  };
}

function secondsUntilTarget(targetIso: string | null, nowMs: number) {
  if (!targetIso) return 0;
  const targetMs = new Date(targetIso).getTime();
  if (!Number.isFinite(targetMs)) return 0;
  return Math.max(0, Math.floor((targetMs - nowMs) / 1000));
}

function formatCockpitEventDate(targetIso: string | null) {
  if (!targetIso) return "Countdown schedule not loaded";
  const date = new Date(targetIso);
  if (Number.isNaN(date.getTime())) return "Countdown schedule unavailable";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// Fixed theme variable definition name to prevent layout warnings
function getAccentForTheme(theme: OwnerGraphicsTheme | null) {
  const anchor = theme?.placement_anchor ?? OWNER_GRAPHICS_DEFAULT_THEME.placement_anchor;
  if (anchor.includes("RIGHT")) return "#ff2faf";
  if (anchor === "CENTER") return "#8a2eff";
  return "#00a8ff";
}

function getTypeAccent(type: OwnerGraphicsPreset["type"]) {
  if (type === "SCRIPTURE") return "border-amber-300/50 text-amber-200";
  if (type === "OFFERING") return "border-lime-300/50 text-lime-200";
  if (type === "TICKER") return "border-orange-300/50 text-orange-200";
  if (type === "SLATE") return "border-violet-300/50 text-violet-200";
  return "border-sky-300/50 text-sky-200";
}

function CockpitPanel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-h-0 overflow-hidden rounded-[6px] border border-white/10 bg-[#050814]/94 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_28px_rgba(0,168,255,0.08)] ${className}`}
    >
      {title ? (
        <div className="border-b border-white/10 px-2 py-1.5 font-ui text-[0.58rem] font-bold uppercase tracking-[0.1em] text-white/72 sm:text-[0.64rem]">
          {title}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function MeterRail({ levelDb, side }: { levelDb: number; side: "left" | "right" }) {
  const activeSegments = Math.max(0, Math.min(20, Math.round(((60 + levelDb) / 60) * 20)));

  return (
    <div className="grid grid-cols-[1.15rem_1fr] items-end gap-1.5">
      <div className="flex h-28 flex-col justify-between font-ui text-[0.42rem] text-white/45 sm:h-32 xl:h-36">
        {DB_STEPS.map((step) => (
          <span key={`${side}-${step}`}>{step}</span>
        ))}
      </div>
      <div>
        <p className="mb-1 text-center font-ui text-[0.55rem] uppercase text-white/70">{side}</p>
        <div className="flex h-28 w-7 flex-col-reverse gap-0.5 rounded-sm border border-white/10 bg-black/55 p-1 sm:h-32 xl:h-36">
          {Array.from({ length: 20 }).map((_, index) => {
            const isHot = index >= 17;
            const isWarn = index >= 13 && index < 17;
            const isActive = index < activeSegments;
            return (
              <span
                key={`${side}-segment-${index}`}
                className={`min-h-0 flex-1 rounded-[1px] ${
                  isActive
                    ? isHot
                      ? "bg-red-500"
                      : isWarn
                        ? "bg-yellow-300"
                        : "bg-emerald-400"
                    : "bg-white/8"
                }`}
              />
            );
          })}
        </div>
        <p className="mt-2 text-center font-ui text-[0.68rem] font-black text-lime-300">
          {levelDb.toFixed(1)} dB
        </p>
      </div>
    </div>
  );
}

function AudioMonitorPanel({
  telemetry,
  loading,
  error,
  onRefresh,
}: {
  telemetry: OwnerAudioTelemetry | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const leftTrack = telemetry?.tracks[0] ?? { id: "program-l", label: "Left", levelDb: -60, peakDb: -60 };
  const rightTrack = telemetry?.tracks[1] ?? { id: "program-r", label: "Right", levelDb: -60, peakDb: -60 };
  const status = telemetry?.mediaNodeStatus ?? "offline";
  const connected = !error && status === "online";
  const degraded = !error && status === "degraded";
  const statusLabel = loading
    ? "X32 SYNCING"
    : connected
      ? "X32 CONNECTED (AUTOMATIC)"
      : degraded
        ? "X32 DEGRADED"
        : "X32 OFFLINE";
  const statusTone = loading
    ? "text-sky-300"
    : connected
      ? "text-lime-300"
      : degraded
        ? "text-amber-300"
        : "text-red-300";
  const statusDot = loading
    ? "bg-sky-300"
    : connected
      ? "bg-lime-400"
      : degraded
        ? "bg-amber-300"
        : "bg-red-400";

  return (
    <CockpitPanel title="AUDIO MONITOR (X32)" className="flex flex-col">
      <div className="flex min-h-0 flex-1 flex-col p-2">
        <div className="flex items-center justify-between gap-2">
          <div className={`inline-flex min-w-0 items-center gap-1.5 truncate font-ui text-[0.5rem] font-black uppercase sm:text-[0.58rem] ${statusTone}`}>
            <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot} ${connected ? "shadow-[0_0_12px_rgba(132,255,75,0.8)]" : ""}`} />
            {statusLabel}
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onRefresh}
            className="grid h-6 w-6 shrink-0 place-items-center rounded border border-white/10 bg-white/5 text-white/70 disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="Refresh audio telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="mt-2 flex-1 rounded-md border border-white/10 bg-black/35 p-2">
          <div className="mb-2 flex items-center gap-1.5 font-ui text-[0.54rem] font-bold uppercase text-white/70 sm:text-[0.6rem]">
            <Lock className="h-3.5 w-3.5 text-purple-400" />
            BUS 15/16 (MAIN)
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <MeterRail side="left" levelDb={leftTrack.levelDb} />
            <MeterRail side="right" levelDb={rightTrack.levelDb} />
          </div>
          <p className="mt-2 text-center font-ui text-[0.5rem] uppercase text-white/60 sm:text-[0.54rem]">
            USB CH 1-2
            <br />
            (BUS 15/16)
          </p>
          <p className="mt-1 truncate text-center font-body text-[0.5rem] text-white/45">
            {error || telemetry?.mediaNodeDetail || "Waiting for audio telemetry."}
          </p>
        </div>

        <div className="mt-2 rounded-md border border-lime-300/20 bg-lime-300/8 px-2 py-1.5 text-center font-ui text-[0.48rem] font-black uppercase leading-tight text-lime-300 sm:text-[0.54rem]">
          MONITOR MIX & HOUSE
          <br />
          CONTROLS LOCKED
        </div>
      </div>
    </CockpitPanel>
  );
}

function CountdownPanel({
  seconds,
  eventName,
  presenterName,
  targetDateTime,
  loading,
  pending,
  onAdjust,
}: {
  seconds: number;
  eventName: string;
  presenterName: string;
  targetDateTime: string | null;
  loading: boolean;
  pending: boolean;
  onAdjust: (offsetSeconds: number) => void;
}) {
  const countdown = getCountdownParts(seconds);
  const controls = [
    { label: "[ +1m ]", offset: 60, tone: "bg-emerald-600 hover:bg-emerald-500" },
    { label: "[ +5m ]", offset: 300, tone: "bg-emerald-600 hover:bg-emerald-500" },
    { label: "[ -1m ]", offset: -60, tone: "bg-red-700 hover:bg-red-600" },
    { label: "[ -5m ]", offset: -300, tone: "bg-red-700 hover:bg-red-600" },
  ];

  return (
    <CockpitPanel title="EVENT COUNTDOWN" className="flex flex-col">
      <div className="flex min-h-0 flex-1 flex-col p-2">
        <div className="flex items-center gap-2">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-[#00a8ff]/50 bg-black/55 text-center font-headline text-lg leading-none text-[#00a8ff] shadow-[0_0_18px_rgba(0,168,255,0.28)] sm:h-14 sm:w-14 sm:text-xl">
            300
            <span className="font-ui text-[0.45rem] tracking-normal text-white">AWAKENING</span>
          </div>
          <div className="min-w-0">
            <p className="truncate font-ui text-[0.58rem] font-black uppercase text-white sm:text-[0.66rem]">
              {eventName || "LIVE EVENT WORKSPACE"}
            </p>
            <p className="mt-1 font-body text-[0.5rem] leading-snug text-white/68 sm:text-[0.58rem]">
              {presenterName || "MAIN SPEAKER"}
              <br />
              {formatCockpitEventDate(targetDateTime)}
            </p>
          </div>
        </div>

        <div className="my-2 h-px bg-white/10" />

        <p className="font-ui text-[0.56rem] uppercase tracking-[0.1em] text-white/55 sm:text-[0.62rem]">
          COUNTDOWN TO SHOW
        </p>
        <div className="mt-1 grid grid-cols-4 gap-1">
          {[
            { label: "Days", value: countdown.days },
            { label: "Hrs", value: countdown.hours },
            { label: "Mins", value: countdown.minutes },
            { label: "Secs", value: countdown.seconds },
          ].map((unit) => (
            <div key={unit.label} className="rounded-md border border-[#00a8ff]/20 bg-black/25 px-1.5 py-1 text-center">
              <p className="font-headline text-2xl leading-none tracking-[0.03em] text-[#00a8ff] drop-shadow-[0_0_12px_rgba(0,168,255,0.7)] sm:text-3xl">
                {loading ? "--" : unit.value.toString().padStart(2, "0")}
              </p>
              <p className="mt-0.5 font-ui text-[0.44rem] font-bold uppercase tracking-[0.08em] text-white/58">
                {unit.label}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-2 rounded border border-[#00a8ff]/20 bg-[#00a8ff]/8 px-2 py-1 text-center font-ui text-[0.48rem] uppercase leading-snug text-[#00a8ff] sm:text-[0.52rem]">
          Synced from /owner/countdown
        </p>

        <div className="mt-auto pt-2">
          <div className="mb-2 h-px bg-white/10" />
          <p className="mb-2 text-center font-ui text-[0.62rem] uppercase text-white/55">
            ADJUST COUNTDOWN
          </p>
          <div className="grid grid-cols-2 gap-2">
            {controls.map((control) => (
              <button
                key={control.label}
                type="button"
                disabled={pending}
                onClick={() => onAdjust(control.offset)}
                className={`min-h-8 rounded-md px-2 font-ui text-xs font-black text-white transition disabled:cursor-not-allowed disabled:opacity-45 ${control.tone}`}
              >
                {pending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : control.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </CockpitPanel>
  );
}

function ProgramReturnPanel({
  livePreset,
  theme,
}: {
  livePreset: OwnerGraphicsPreset | null;
  theme: OwnerGraphicsTheme | null;
}) {
  const accent = getAccentForTheme(theme);
  const primary = livePreset?.content_primary || "NO LIVE OVERLAY";
  const secondary = livePreset?.content_secondary || "STAGED IN DECK QUEUE";

  return (
    <CockpitPanel className="flex min-h-0 flex-col p-2">
      <div className="mb-1.5 font-ui text-[0.58rem] font-bold uppercase tracking-[0.08em] text-white/72 sm:text-[0.64rem]">
        LIVE PROGRAM RETURN (16:9) - TITLE-SAFE LOCKED (5% INSET)
      </div>
      <div className="relative aspect-video w-full overflow-hidden rounded-md border border-white/20 bg-black xl:min-h-0 xl:flex-1">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(138,46,255,0.45),transparent_22%),linear-gradient(180deg,#14114d_0%,#060710_52%,#020203_100%)]" />
        <div className="absolute inset-x-[8%] top-[10%] h-[48%] rounded-full bg-[#00a8ff]/20 blur-3xl" />
        <div className="absolute inset-x-[8%] bottom-0 h-[32%] bg-gradient-to-t from-black via-black/70 to-transparent" />

        <div className="absolute left-[13%] top-[28%] h-[32%] w-2 rounded-full bg-[#18131b] shadow-[4rem_1rem_0_0_rgba(10,10,12,0.88),9rem_-0.6rem_0_0_rgba(10,10,12,0.86),15rem_0.5rem_0_0_rgba(10,10,12,0.88),22rem_-0.5rem_0_0_rgba(10,10,12,0.84),29rem_0.8rem_0_0_rgba(10,10,12,0.88),36rem_-0.4rem_0_0_rgba(10,10,12,0.84)]" />
        <div className="absolute left-[45%] top-[16%] h-[34%] w-1 bg-amber-200 shadow-[0_0_18px_rgba(255,220,130,0.95)]">
          <span className="absolute left-1/2 top-[34%] h-1 w-16 -translate-x-1/2 bg-amber-200 shadow-[0_0_18px_rgba(255,220,130,0.95)]" />
        </div>

        <div className="absolute inset-[5%] border border-white/18" />
        <div className="absolute right-[6%] top-[6%] text-right font-headline text-3xl leading-none text-[#00a8ff] drop-shadow-[0_0_16px_rgba(0,168,255,0.7)] sm:text-4xl">
          300
          <span className="block font-ui text-[0.52rem] tracking-[0.12em] text-white">AWAKENING</span>
        </div>

        <div
          className="absolute bottom-[8%] left-[15%] right-[12%] min-h-12 skew-x-[-18deg] border-l-[8px] border-r-[8px] bg-black/78 shadow-[0_0_20px_rgba(0,0,0,0.55)] sm:min-h-16 sm:border-l-[10px] sm:border-r-[10px]"
          style={{ borderLeftColor: accent, borderRightColor: "#ff2faf" }}
        >
          <div className="flex h-full min-h-12 skew-x-[18deg] flex-col items-center justify-center px-4 text-center sm:min-h-16 sm:px-8">
            <p className="font-ui text-lg font-black uppercase tracking-[0.05em] text-white sm:text-2xl">
              {primary}
            </p>
            <p className="font-ui text-xs font-black uppercase tracking-[0.14em] text-[#ff2faf] sm:text-sm">
              {secondary}
            </p>
          </div>
        </div>
      </div>
    </CockpitPanel>
  );
}

function StreamMatrixPanel({
  broadcastPending,
  broadcastMessage,
  broadcastError,
  destinations,
  destinationsLoading,
  destinationSaving,
  onGoLive,
  onStop,
  onDestinationChange,
}: {
  broadcastPending: boolean;
  broadcastMessage: string | null;
  broadcastError: string | null;
  destinations: RestreamDestinations;
  destinationsLoading: boolean;
  destinationSaving: DestinationKey | null;
  onGoLive: () => void;
  onStop: () => void;
  onDestinationChange: (destination: DestinationKey, enabled: boolean) => void;
}) {
  const destinationRows: Array<{ key: DestinationKey | "instagram"; name: string; on: boolean; disabled?: boolean }> = [
    { key: "youtube", name: "YouTube", on: destinations.youtube },
    { key: "facebook", name: "Facebook", on: destinations.facebook },
    { key: "twitch", name: "Twitch", on: destinations.twitch },
    { key: "instagram", name: "Instagram", on: true, disabled: true },
  ];

  return (
    <div className="grid min-h-0 gap-2 sm:grid-cols-[0.48fr_0.52fr]">
      <CockpitPanel title="STREAM STATUS" className="p-2">
        <div className="grid h-full grid-rows-[1fr_auto] gap-2">
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              disabled={broadcastPending}
              onClick={onGoLive}
              className="flex min-h-16 items-center justify-center gap-2 rounded-md bg-gradient-to-br from-lime-400 to-green-700 px-3 font-ui text-xl font-black uppercase text-black shadow-[0_0_22px_rgba(85,255,75,0.28)] disabled:cursor-not-allowed disabled:opacity-45 xl:min-h-20 xl:text-2xl"
            >
              {broadcastPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Play className="h-7 w-7 fill-black" />}
              GO LIVE
            </button>
            <button
              type="button"
              disabled={broadcastPending}
              onClick={onStop}
              className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-[#08101f] px-3 font-ui text-[0.62rem] font-bold uppercase text-white/78 disabled:cursor-not-allowed disabled:opacity-45 xl:min-h-14 xl:text-xs"
            >
              {broadcastPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
              STOP STREAMING
            </button>
          </div>
          <div className="min-h-7 rounded-md border border-white/10 bg-black/25 px-2 py-1.5 font-body text-[0.58rem] text-white/65">
            {broadcastError ? <span className="text-red-200">{broadcastError}</span> : broadcastMessage || "Stream commands ready."}
          </div>
        </div>
      </CockpitPanel>

      <CockpitPanel title="DESTINATIONS (RESTREAM)" className="p-2">
        <div className="space-y-1.5">
          {destinationRows.map((destination) => (
            <div key={destination.name} className="flex items-center justify-between rounded-md border border-white/8 bg-black/24 px-2 py-1.5">
              <span className="font-body text-[0.68rem] font-semibold text-white/82 xl:text-xs">{destination.name}</span>
              {destination.disabled || destination.key === "instagram" ? (
                <span className="rounded bg-lime-400 px-2 py-1 font-ui text-[0.55rem] font-black uppercase text-black">
                  [ ON ]
                </span>
              ) : (
                <button
                  type="button"
                  disabled={destinationsLoading || destinationSaving === destination.key}
                  onClick={() => onDestinationChange(destination.key as DestinationKey, !destination.on)}
                  aria-pressed={destination.on}
                  className={`rounded px-2 py-1 font-ui text-[0.55rem] font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-55 ${
                    destination.on ? "bg-lime-400 text-black" : "bg-slate-600 text-white/75"
                  }`}
                >
                  {destinationSaving === destination.key ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    `[ ${destination.on ? "ON" : "OFF"} ]`
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 rounded-md border border-white/10 bg-black/30 px-2 py-1.5 font-body text-[0.68rem] text-white/78">
          Concurrent Viewers:
          <span className="ml-2 font-ui font-black text-white">1,246</span>
        </div>
      </CockpitPanel>
    </div>
  );
}

function GraphicThumbnail({ preset }: { preset: OwnerGraphicsPreset }) {
  const isTicker = preset.type === "TICKER";
  const isSlate = preset.type === "SLATE";

  return (
    <div
      className={`relative h-full min-h-10 overflow-hidden rounded border border-white/10 bg-black ${
        isTicker ? "bg-gradient-to-r from-orange-950 via-black to-orange-900" : ""
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(138,46,255,0.42),transparent_42%),linear-gradient(180deg,#100c35_0%,#05050a_100%)]" />
      {isSlate ? (
        <div className="absolute inset-1 grid place-items-center rounded bg-[#100d2e] text-center font-ui text-[0.42rem] font-black uppercase leading-none text-white">
          STARTING SOON
        </div>
      ) : isTicker ? (
        <div className="absolute inset-x-1 bottom-1 h-2 rounded-sm bg-orange-500/80" />
      ) : (
        <div className="absolute inset-x-1 bottom-1 h-3 skew-x-[-18deg] border-l-2 border-[#00a8ff] border-r-2 border-[#ff2faf] bg-black/80" />
      )}
      <span className="absolute left-1 top-1 max-w-[86%] truncate font-ui text-[0.38rem] font-black uppercase text-white">
        {preset.content_primary}
      </span>
    </div>
  );
}

function GraphicsRow({
  preset,
  index,
  timer,
  now,
  mutating,
  clearing,
  onToggle,
}: {
  preset: OwnerGraphicsPreset;
  index: number;
  timer: RuntimeTimer | undefined;
  now: number;
  mutating: boolean;
  clearing: boolean;
  onToggle: (preset: OwnerGraphicsPreset, nextActive: boolean) => void;
}) {
  const isLive = preset.is_active_on_stream;
  const duration = preset.duration_seconds ?? 0;
  const hasDurationTimer = duration > 0;
  const elapsedSeconds = timer ? (now - timer.startedAt) / 1000 : 0;
  const remainingSeconds = timer ? Math.max(0, timer.durationSeconds - elapsedSeconds) : duration;
  const progress = timer && timer.durationSeconds > 0 ? Math.max(0, Math.min(100, (remainingSeconds / timer.durationSeconds) * 100)) : isLive ? 100 : 0;

  return (
    <article
      className={`relative grid min-h-[3.4rem] grid-cols-[2rem_3.8rem_minmax(0,1fr)_5.8rem] gap-1.5 overflow-hidden rounded-md border bg-black/32 p-1.5 sm:grid-cols-[2rem_4.4rem_minmax(0,1fr)_6rem] ${
        isLive ? "border-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.28)]" : "border-white/10"
      }`}
    >
      <div className="grid place-items-center rounded bg-[#060b18] font-ui text-[0.58rem] font-black text-white/72">
        {(index + 1).toString().padStart(3, "0")}
      </div>
      <GraphicThumbnail preset={preset} />
      <div className="min-w-0 rounded border border-white/8 bg-[#050814] px-2 py-1">
        <div className="flex flex-wrap items-center gap-1">
          <span className={`inline-flex rounded border px-1.5 py-0.5 font-ui text-[0.5rem] font-black uppercase ${getTypeAccent(preset.type)}`}>
            {formatGraphicsTypeLabel(preset.type)}
          </span>
          {isLive ? (
            <span className="inline-flex animate-pulse rounded border border-emerald-300/70 bg-emerald-300/15 px-1.5 py-0.5 font-ui text-[0.48rem] font-black uppercase text-emerald-200">
              LIVE ON STREAM
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate font-ui text-[0.62rem] font-black uppercase text-white">
          {preset.content_primary}
        </p>
        <p className="truncate font-body text-[0.62rem] text-white/55">
          {preset.content_secondary || "No secondary copy"}
        </p>
      </div>
      <button
        type="button"
        disabled={mutating || clearing}
        onClick={() => onToggle(preset, !isLive)}
        className={`rounded-md px-1.5 py-1 font-ui text-[0.48rem] font-black uppercase leading-tight transition disabled:cursor-not-allowed disabled:opacity-45 ${
          isLive
            ? "border border-red-300/70 bg-red-700 text-white shadow-[0_0_14px_rgba(220,38,38,0.35)] hover:bg-red-600"
            : "border border-[#00a8ff]/60 bg-[#00a8ff] text-black shadow-[0_0_14px_rgba(0,168,255,0.28)] hover:bg-white"
        }`}
      >
        {mutating ? (
          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
        ) : isLive ? (
          <>
            ➖ REMOVE FROM STREAM
            <span className="block text-[0.48rem] opacity-75">
              {hasDurationTimer ? formatDuration(Math.ceil(remainingSeconds)) : "MANUAL"}
            </span>
          </>
        ) : (
          <>
            ➕ DISPLAY NOW
            <span className="block text-[0.48rem] opacity-75">
              {hasDurationTimer ? formatDuration(duration) : "MANUAL"}
            </span>
          </>
        )}
      </button>
      {isLive ? (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
          <div className="h-full bg-lime-300 transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </article>
  );
}

function GraphicsDeckPanel({
  presets,
  loading,
  error,
  success,
  runtimeTimers,
  now,
  mutatingId,
  clearing,
  onRefresh,
  onToggle,
  onClear,
}: {
  presets: OwnerGraphicsPreset[];
  loading: boolean;
  error: string | null;
  success: string | null;
  runtimeTimers: Record<string, RuntimeTimer>;
  now: number;
  mutatingId: string | null;
  clearing: boolean;
  onRefresh: () => void;
  onToggle: (preset: OwnerGraphicsPreset, nextActive: boolean) => void;
  onClear: () => void;
}) {
  return (
    <CockpitPanel className="grid h-full min-h-0 grid-rows-[auto_1fr_auto]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-2 py-1.5">
        <div>
          <p className="font-ui text-[0.66rem] font-black uppercase tracking-[0.08em] text-white">
            GRAPHICS PLAYBACK DECK
          </p>
          <p className="mt-0.5 inline-flex animate-pulse items-center gap-1 font-ui text-[0.48rem] font-bold uppercase text-[#ff2faf]">
            <AlertTriangle className="h-3 w-3" />
            AUTO-CLEAR TIMER ENABLED
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={onRefresh}
          className="grid h-7 w-7 place-items-center rounded border border-white/10 bg-white/5 text-white/70 disabled:opacity-45"
          aria-label="Refresh graphics deck"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="min-h-0 space-y-1.5 overflow-y-auto p-2">
        {error ? (
          <div className="rounded-md border border-red-500/35 bg-red-500/10 px-3 py-2 font-body text-xs text-red-100">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-md border border-lime-400/30 bg-lime-400/10 px-3 py-2 font-body text-xs text-lime-100">
            {success}
          </div>
        ) : null}
        {loading ? (
          <div className="grid min-h-40 place-items-center rounded-md border border-white/10 bg-black/20 font-body text-sm text-white/60">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#00a8ff]" />
              Loading live graphics queue...
            </span>
          </div>
        ) : presets.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/15 bg-black/24 p-5 text-center font-body text-sm text-white/50">
            No graphics presets are available. Build them in the Graphics Suite, then return to this cockpit.
          </div>
        ) : (
          presets.map((preset, index) => (
            <GraphicsRow
              key={preset.id}
              preset={preset}
              index={index}
              timer={runtimeTimers[preset.id]}
              now={now}
              mutating={mutatingId === preset.id}
              clearing={clearing}
              onToggle={onToggle}
            />
          ))
        )}
      </div>

      <div className="border-t border-red-300/25 bg-[#210004]/95 p-2">
        <button
          type="button"
          disabled={clearing}
          onClick={onClear}
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-red-600 px-3 text-center font-ui text-xs font-black uppercase leading-tight text-white shadow-[0_0_24px_rgba(220,38,38,0.45)] transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-55 sm:text-sm"
        >
          {clearing ? <Loader2 className="h-5 w-5 animate-spin" /> : <AlertTriangle className="h-5 w-5" />}
          CLEAR ALL GRAPHICS
          <span className="hidden sm:inline">(WIPES OUTPUT INSTANTLY)</span>
        </button>
      </div>
    </CockpitPanel>
  );
}

function InfrastructureFooter({ synced }: { synced: boolean }) {
  const checks = [
    "X32 Mixer: Connected",
    "OBS Studio: Connected",
    "Restream: Connected",
    synced ? "Database: Synced" : "Database: Resyncing",
  ];

  return (
    <footer className="grid min-h-0 gap-2 lg:grid-cols-[1.05fr_0.95fr]">
      <CockpitPanel title="PLUG & PLAY AUTOMATION" className="p-2">
        <div className="grid h-full gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/25 p-2">
            <MonitorDot className="h-8 w-8 text-white/55" />
            <div>
              <p className="font-ui text-[0.58rem] font-black uppercase text-white">X32 Auto-Discovery</p>
              <p className="mt-1 font-body text-[0.52rem] leading-snug text-white/55 sm:text-[0.58rem]">
                Auto-connects on USB/LAN. Tracks Bus 15/16 (CH 1-2).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/25 p-2">
            <Radio className="h-8 w-8 text-white/55" />
            <div>
              <p className="font-ui text-[0.58rem] font-black uppercase text-white">OBS Integration</p>
              <p className="mt-1 font-body text-[0.52rem] leading-snug text-white/55 sm:text-[0.58rem]">
                Pre-saved profiles and stream keys mapped for show launch.
              </p>
            </div>
          </div>
        </div>
      </CockpitPanel>

      <CockpitPanel title="SYSTEM STATUS" className="grid grid-cols-[1fr_7.4rem] gap-2 p-2">
        <div className="space-y-1">
          {checks.map((check) => (
            <p key={check} className="flex items-center gap-1.5 font-body text-[0.58rem] text-white/76 sm:text-xs">
              <CheckCircle2 className={`h-3.5 w-3.5 ${check.includes("Resyncing") ? "text-amber-300" : "text-lime-300"}`} />
              {check}
            </p>
          ))}
        </div>
        <div className="grid place-items-center rounded-md border border-[#00a8ff]/25 bg-black/35 text-center font-headline text-4xl leading-none text-[#00a8ff] drop-shadow-[0_0_16px_rgba(0,168,255,0.8)] sm:text-5xl">
          300
          <span className="font-ui text-[0.62rem] tracking-[0.1em] text-white">AWAKENING</span>
        </div>
      </CockpitPanel>
    </footer>
  );
}

export default function ProductionCockpitClient() {
  const [presets, setPresets] = useState<OwnerGraphicsPreset[]>([]);
  const [theme, setTheme] = useState<OwnerGraphicsTheme | null>(null);
  const [runtimeTimers, setRuntimeTimers] = useState<Record<string, RuntimeTimer>>({});
  const [now, setNow] = useState(Date.now());
  const [countdownTargetIso, setCountdownTargetIso] = useState<string | null>(null);
  const [countdownEventName, setCountdownEventName] = useState("LIVE EVENT WORKSPACE");
  const [countdownPresenterName, setCountdownPresenterName] = useState("MAIN SPEAKER");
  const [graphicsLoading, setGraphicsLoading] = useState(true);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [countdownPending, setCountdownPending] = useState(false);
  const [broadcastPending, setBroadcastPending] = useState(false);
  const [destinations, setDestinations] = useState<RestreamDestinations>(DEFAULT_RESTREAM_DESTINATIONS);
  const [destinationsLoading, setDestinationsLoading] = useState(true);
  const [destinationSaving, setDestinationSaving] = useState<DestinationKey | null>(null);
  const [audioTelemetry, setAudioTelemetry] = useState<OwnerAudioTelemetry | null>(null);
  const [audioLoading, setAudioLoading] = useState(true);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [graphicsError, setGraphicsError] = useState<string | null>(null);
  const [graphicsSuccess, setGraphicsSuccess] = useState<string | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);
  const [systemSynced, setSystemSynced] = useState(false);
  const autoClearedIds = useRef<Set<string>>(new Set());

  const livePreset = useMemo(
    () => presets.find((preset) => preset.is_active_on_stream) ?? null,
    [presets],
  );

  const loadAudioTelemetry = useCallback(async (silent = false) => {
    if (!silent) setAudioLoading(true);
    setAudioError(null);

    try {
      const response = await fetch("/api/owner/audio/mix-state", {
        credentials: "include",
        cache: "no-store",
      });
      const json = (await response.json()) as AudioMixStateResponse;

      if (!response.ok || json.ok === false || json.success === false || !json.telemetry) {
        throw new Error(json.error || "Unable to load audio telemetry.");
      }

      setAudioTelemetry(json.telemetry);
    } catch (audioLoadError) {
      setAudioError(audioLoadError instanceof Error ? audioLoadError.message : "Unable to load audio telemetry.");
    } finally {
      if (!silent) setAudioLoading(false);
    }
  }, []);
  const countdownSeconds = useMemo(
    () => secondsUntilTarget(countdownTargetIso, now),
    [countdownTargetIso, now],
  );

  const loadShowSetup = useCallback(async () => {
    setDestinationsLoading(true);

    try {
      const response = await fetch("/api/owner/show-setup", {
        credentials: "include",
        cache: "no-store",
      });
      const json = (await response.json()) as ShowSetupResponse;

      if (!response.ok || !json.state) {
        throw new Error(json.error || "Unable to load show setup.");
      }

      setCountdownEventName(json.state.showTitle || "LIVE EVENT WORKSPACE");
      setCountdownPresenterName(json.state.presenterName || "MAIN SPEAKER");
      setCountdownTargetIso(json.state.targetDateTime || null);
      setDestinations({
        youtube: json.state.restreamDestinations?.youtube ?? DEFAULT_RESTREAM_DESTINATIONS.youtube,
        facebook: json.state.restreamDestinations?.facebook ?? DEFAULT_RESTREAM_DESTINATIONS.facebook,
        twitch: json.state.restreamDestinations?.twitch ?? DEFAULT_RESTREAM_DESTINATIONS.twitch,
      });
      setBroadcastMessage(json.message || "Show setup loaded.");
    } catch (setupError) {
      setBroadcastError(setupError instanceof Error ? setupError.message : "Unable to load show setup.");
    } finally {
      setDestinationsLoading(false);
    }
  }, []);

  const loadGraphics = useCallback(async () => {
    setGraphicsLoading(true);
    setGraphicsError(null);

    try {
      const [presetResponse, themeResponse] = await Promise.all([
        fetch("/api/owner/graphics/presets", { cache: "no-store" }),
        fetch("/api/owner/graphics/theme", { cache: "no-store" }),
      ]);
      const presetJson = (await presetResponse.json()) as ApiPresetResponse;
      const themeJson = (await themeResponse.json()) as ApiThemeResponse;

      if (!presetResponse.ok || !presetJson.success) {
        throw new Error(presetJson.error || "Unable to load graphics cockpit.");
      }
      if (!themeResponse.ok || !themeJson.success) {
        throw new Error(themeJson.error || "Unable to load graphics theme.");
      }

      setPresets(sortPresets(presetJson.presets ?? []));
      setTheme(themeJson.theme ?? null);
      setSystemSynced(true);
    } catch (loadError) {
      setSystemSynced(false);
      setGraphicsError(loadError instanceof Error ? loadError.message : "Unable to load graphics cockpit.");
    } finally {
      setGraphicsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadGraphics(), 0);
    return () => window.clearTimeout(timer);
  }, [loadGraphics]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadShowSetup(), 0);
    return () => window.clearTimeout(timer);
  }, [loadShowSetup]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAudioTelemetry(), 0);
    const interval = window.setInterval(() => void loadAudioTelemetry(true), 4_000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [loadAudioTelemetry]);

  useEffect(() => {
    const supabase = getSupabase();

    try {
      const channel = supabase
        .channel(`owner-production-cockpit-${OWNER_GRAPHICS_EVENT_ID}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "owner_graphics_presets",
            filter: `event_id=eq.${OWNER_GRAPHICS_EVENT_ID}`,
          },
          (payload) => {
            setSystemSynced(true);
            if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as Partial<OwnerGraphicsPreset>).id;
              if (deletedId) setPresets((current) => removePreset(current, deletedId));
              return;
            }

            const nextPreset = payload.new as OwnerGraphicsPreset;
            if (nextPreset?.id) setPresets((current) => mergePreset(current, nextPreset));
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "owner_graphics_global_theme",
            filter: `event_id=eq.${OWNER_GRAPHICS_EVENT_ID}`,
          },
          (payload) => {
            setSystemSynced(true);
            const nextTheme = payload.new as OwnerGraphicsTheme;
            if (nextTheme?.id) setTheme(nextTheme);
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") setSystemSynced(true);
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            setSystemSynced(false);
            setGraphicsError("Realtime graphics channel disconnected. Use refresh to resync.");
          }
        });

      return () => {
        try {
          void supabase.removeChannel(channel);
        } catch {
          setSystemSynced(false);
        }
      };
    } catch {
      setSystemSynced(false);
      setGraphicsError("Realtime graphics subscription failed to initialize.");
      return undefined;
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const togglePreset = useCallback(
    async (preset: OwnerGraphicsPreset, nextActive: boolean, triggeredByTimer = false) => {
      setMutatingId(triggeredByTimer ? null : preset.id);
      setGraphicsError(null);
      if (!triggeredByTimer) setGraphicsSuccess(null);

      try {
        const response = await fetch("/api/owner/graphics/presets", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: preset.id, isActiveOnStream: nextActive }),
        });
        const json = (await response.json()) as ApiPresetResponse;

        if (!response.ok || !json.success || !json.preset) {
          throw new Error(json.error || "Unable to update graphic state.");
        }

        setPresets((current) => mergePreset(current, json.preset as OwnerGraphicsPreset));

        if (nextActive) {
          const durationSeconds = preset.duration_seconds ?? 0;
          autoClearedIds.current.delete(preset.id);

          if (durationSeconds > 0) {
            setRuntimeTimers({
              [preset.id]: { startedAt: Date.now(), durationSeconds },
            });
          } else {
            setRuntimeTimers((current) => {
              const next = { ...current };
              delete next[preset.id];
              return next;
            });
          }
        } else {
          setRuntimeTimers((current) => {
            const next = { ...current };
            delete next[preset.id];
            return next;
          });
        }

        if (!triggeredByTimer) {
          setGraphicsSuccess(
            nextActive
              ? `${preset.content_primary} is now live on stream.`
              : `${preset.content_primary} removed from stream.`,
          );
        }
      } catch (toggleError) {
        setGraphicsError(toggleError instanceof Error ? toggleError.message : "Unable to update graphic state.");
      } finally {
        setMutatingId(null);
      }
    },
    [],
  );

  useEffect(() => {
    presets.forEach((preset) => {
      const timer = runtimeTimers[preset.id];
      if (!preset.is_active_on_stream || !timer || autoClearedIds.current.has(preset.id)) return;

      const elapsedMs = now - timer.startedAt;
      if (elapsedMs >= timer.durationSeconds * 1000) {
        autoClearedIds.current.add(preset.id);
        void togglePreset(preset, false, true);
      }
    });
  }, [now, presets, runtimeTimers, togglePreset]);

  const clearAllGraphics = useCallback(async () => {
    setClearing(true);
    setGraphicsError(null);
    setGraphicsSuccess(null);

    try {
      const response = await fetch("/api/owner/graphics/presets", { method: "DELETE" });
      const json = (await response.json()) as ApiPresetResponse;

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Unable to clear live graphics.");
      }

      setPresets((current) => current.map((preset) => ({ ...preset, is_active_on_stream: false })));
      setRuntimeTimers({});
      autoClearedIds.current.clear();
      setGraphicsSuccess(`Emergency clear complete. ${json.clearedCount ?? 0} graphic(s) removed.`);
    } catch (clearError) {
      setGraphicsError(clearError instanceof Error ? clearError.message : "Unable to clear live graphics.");
    } finally {
      style-locked
      setClearing(false);
    }
  }, []);

  const adjustCountdown = useCallback(async (offsetSeconds: number) => {
    setCountdownPending(true);
    setGraphicsError(null);

    try {
      const response = await fetch("/api/owner/countdown", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offsetSeconds }),
      });
      const json = (await response.json()) as { ok?: boolean; error?: string; message?: string };

      if (!response.ok) {
        throw new Error(json.error || "Countdown adjustment failed.");
      }

      await loadShowSetup();
      setGraphicsSuccess(json.message || "Countdown adjusted.");
    } catch (countdownError) {
      setGraphicsError(countdownError instanceof Error ? countdownError.message : "Countdown adjustment failed.");
    } finally {
      setCountdownPending(false);
    }
  }, [loadShowSetup]);

  const sendBroadcastCommand = useCallback(async (endpoint: string, body?: unknown) => {
    setBroadcastPending(true);
    setBroadcastError(null);
    setBroadcastMessage("Sending broadcast command...");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = (await response.json()) as BroadcastResponse;

      if (!response.ok || json.ok === false) {
        throw new Error(json.message || json.error || `Broadcast command failed with HTTP ${response.status}.`);
      }

      setBroadcastMessage(json.message || "Broadcast command confirmed.");
    } catch (commandError) {
      setBroadcastError(commandError instanceof Error ? commandError.message : "Broadcast command failed.");
      setBroadcastMessage(null);
    } finally {
      setBroadcastPending(false);
    }
  }, []);

  const runGoLiveWithPreflight = useCallback(async () => {
    setBroadcastPending(true);
    setBroadcastError(null);
    setBroadcastMessage("Running broadcast preflight...");

    try {
      const preflightResponse = await fetch("/api/owner/broadcast/preflight", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "rtmp_encoder" }),
      });
      const preflightJson = (await preflightResponse.json()) as BroadcastResponse;

      if (!preflightResponse.ok || preflightJson.blocked || preflightJson.ok === false) {
        throw new Error(
          preflightJson.message ||
            preflightJson.error ||
            `Broadcast preflight failed with HTTP ${preflightResponse.status}.`,
        );
      }

      setBroadcastMessage("Preflight passed. Sending go-live command...");

      const goLiveResponse = await fetch("/api/owner/broadcast/go-live", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "rtmp_encoder", confirm: true }),
      });
      const goLiveJson = (await goLiveResponse.json()) as BroadcastResponse;

      if (!goLiveResponse.ok || goLiveJson.ok === false) {
        throw new Error(
          goLiveJson.message ||
            goLiveJson.error ||
            `Go-live command failed with HTTP ${goLiveResponse.status}.`,
        );
      }

      setBroadcastMessage(goLiveJson.message || "Go-live command confirmed.");
    } catch (goLiveError) {
      setBroadcastError(goLiveError instanceof Error ? goLiveError.message : "Go-live command failed.");
      setBroadcastMessage(null);
    } finally {
      setBroadcastPending(false);
    }
  }, []);

  const handleDestinationChange = useCallback(
    async (destination: DestinationKey, enabled: boolean) => {
      if (destinationSaving) return;

      setDestinationSaving(destination);
      setBroadcastError(null);
      const previous = destinations;
      const nextDestinations = { ...destinations, [destination]: enabled };
      setDestinations(nextDestinations);
      setBroadcastMessage(`Saving ${destination} Restream target...`);

      try {
        const response = await fetch("/api/owner/show-setup", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restreamDestinations: nextDestinations }),
        });
        const json = (await response.json()) as ShowSetupResponse;

        if (!response.ok || !json.state) {
          throw new Error(json.error || `Unable to save ${destination} Restream target.`);
        }

        setDestinations({
          youtube: json.state.restreamDestinations?.youtube ?? nextDestinations.youtube,
          facebook: json.state.restreamDestinations?.facebook ?? nextDestinations.facebook,
          twitch: json.state.restreamDestinations?.twitch ?? nextDestinations.twitch,
        });
        setBroadcastMessage(json.message || `${destination} Restream target saved.`);
      } catch (destinationError) {
        setDestinations(previous);
        setBroadcastError(
          destinationError instanceof Error
            ? destinationError.message
            : `Unable to save ${destination} Restream target.`,
        );
        setBroadcastMessage(null);
      } finally {
        setDestinationSaving(null);
      }
    },
    [destinationSaving, destinations],
  );

  return (
    <main className="min-h-dvh overflow-x-hidden overflow-y-auto bg-[#020203] bg-[radial-gradient(circle_at_22%_0%,rgba(0,168,255,0.13),transparent_28%),radial-gradient(circle_at_78%_4%,rgba(255,47,175,0.15),transparent_30%),linear-gradient(180deg,#050507_0%,#020203_54%,#010102_100%)] px-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 text-white">
      <div className="mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-screen-2xl flex-col gap-2">
        <header className="shrink-0 rounded-[6px] border border-white/10 bg-[#050814]/94 px-3 py-2 shadow-[0_0_28px_rgba(0,168,255,0.08)] sm:px-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="font-headline text-[1.45rem] uppercase leading-none tracking-[0.02em] sm:text-3xl lg:text-4xl">
                <span className="text-[#00a8ff]">PRODUCTION COCKPIT</span>{" "}
                <span className="text-[#ff2faf]">EXECUTION DECK</span>
              </p>
              <p className="mt-1 font-ui text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-white/72 sm:text-[0.68rem]">
                LIVE CONTROL / AUDIO MONITOR / GRAPHICS PLAYBACK / AUTO-FIT RESPONSIVE SHELL
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <span className="inline-flex items-center gap-1.5 rounded border border-purple-500/40 bg-purple-500/10 px-2 py-1 font-ui text-[0.52rem] font-black uppercase tracking-[0.08em] text-purple-400 sm:text-[0.6rem]">
                <Timer className="h-3 w-3" />
                Event Phase: Pre-Show
              </span>
              <span className="inline-flex items-center gap-1.5 rounded border border-lime-300/35 bg-lime-300/10 px-2 py-1 font-ui text-[0.52rem] font-black uppercase tracking-[0.08em] text-lime-300 sm:text-[0.6rem]">
                <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(132,255,75,0.8)]" />
                Publish: Encoder Ready
              </span>
              <span className="inline-flex items-center gap-1.5 rounded border border-[#00a8ff]/35 bg-[#00a8ff]/10 px-2 py-1 font-ui text-[0.52rem] font-black uppercase tracking-[0.08em] text-[#00a8ff] sm:text-[0.6rem]">
                <Database className="h-3 w-3" />
                Playback: {systemSynced ? "Database Synced" : "Database Resyncing"}
              </span>
              <button
                type="button"
                disabled={clearing}
                onClick={() => void clearAllGraphics()}
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-red-600 px-3 font-ui text-[0.58rem] font-black uppercase tracking-[0.1em] text-white shadow-[0_0_24px_rgba(220,38,38,0.45)] transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-55 sm:px-4 sm:text-xs"
              >
                {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                Clear All Graphics
              </button>
            </div>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-2 xl:grid-cols-[17rem_minmax(0,1fr)_26rem]">
          <section className="order-1 grid min-h-0 gap-2 xl:order-2 xl:grid-rows-[minmax(0,1fr)_12.5rem]">
            <ProgramReturnPanel livePreset={livePreset} theme={theme} />
            <StreamMatrixPanel
              broadcastPending={broadcastPending}
              broadcastMessage={broadcastMessage}
              broadcastError={broadcastError}
              destinations={destinations}
              destinationsLoading={destinationsLoading}
              destinationSaving={destinationSaving}
              onGoLive={() => void runGoLiveWithPreflight()}
              onStop={() => void sendBroadcastCommand("/api/owner/broadcast/end")}
              onDestinationChange={(destination, enabled) => void handleDestinationChange(destination, enabled)}
            />
          </section>

          <aside className="order-2 min-h-[24rem] xl:order-3 xl:min-h-0">
            <GraphicsDeckPanel
              presets={presets}
              loading={graphicsLoading}
              error={graphicsError}
              success={graphicsSuccess}
              runtimeTimers={runtimeTimers}
              now={now}
              mutatingId={mutatingId}
              clearing={clearing}
              onRefresh={() => void loadGraphics()}
              onToggle={(preset, nextActive) => void togglePreset(preset, nextActive)}
              onClear={() => void clearAllGraphics()}
            />
          </aside>

          <aside className="order-3 grid min-h-0 gap-2 md:grid-cols-2 xl:order-1 xl:grid-cols-1 xl:grid-rows-[minmax(0,1fr)_minmax(0,0.88fr)]">
            <AudioMonitorPanel
              telemetry={audioTelemetry}
              loading={audioLoading}
              error={audioError}
              onRefresh={() => void loadAudioTelemetry()}
            />
            <CountdownPanel
              seconds={countdownSeconds}
              eventName={countdownEventName}
              presenterName={countdownPresenterName}
              targetDateTime={countdownTargetIso}
              loading={destinationsLoading}
              pending={countdownPending}
              onAdjust={(offset) => void adjustCountdown(offset)}
            />
          </aside>
        </div>

        <div className="shrink-0">
          <InfrastructureFooter synced={systemSynced} />
        </div>
      </div>
    </main>
  );
}