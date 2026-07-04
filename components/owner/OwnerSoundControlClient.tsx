"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  AudioLines,
  Check,
  CircleCheck,
  CircleX,
  Clock3,
  Gauge,
  Loader2,
  Music2,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  UserRound,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AUDIO_PRESET_SPECS,
  OWNER_SOUND_BUS_SPECS,
  type AudioPresetStatus,
  type ConcertEqPreset,
  type OwnerAudioBusKey,
  type OwnerAudioBusTelemetry,
  type OwnerAudioTelemetry,
} from "@/lib/owner/audio-contracts";

type AudioMixStateResponse = {
  ok?: boolean;
  success?: boolean;
  telemetry?: OwnerAudioTelemetry;
  presets?: AudioPresetStatus[];
  operatorEmail?: string;
  showTitle?: string | null;
  message?: string;
  error?: string;
};

type PendingAction =
  | { kind: "preset"; presetId: ConcertEqPreset; label: string }
  | { kind: "mute"; busKey: OwnerAudioBusKey; label: string; muted: boolean }
  | null;

type ToastState = { tone: "success" | "error"; message: string } | null;

const DEFAULT_PRESETS: AudioPresetStatus[] = AUDIO_PRESET_SPECS.map((preset) => ({
  ...preset,
  configured: false,
  active: false,
}));

const EMPTY_BUSES: OwnerAudioBusTelemetry[] = OWNER_SOUND_BUS_SPECS.map((bus) => ({
  key: bus.key,
  label: bus.label,
  levelDb: -90,
  peakDb: null,
  muted: false,
  limiterActive: false,
  status: "offline",
  lastUpdateAt: null,
}));

const METER_SEGMENTS = 24;
const METER_FLOOR_DB = -60;
const METER_STEPS = [0, -6, -12, -18, -24, -30, -36, -42, -48, -54, -60];

function Panel({
  title,
  children,
  className = "",
  action,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={`min-w-0 border border-[#26323a] bg-[#05090c] ${className}`}>
      <header className="flex min-h-11 items-center justify-between gap-2 border-b border-[#26323a] px-3">
        <h2 className="font-ui text-[0.68rem] font-black uppercase tracking-[0.08em] text-cyan-300">
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function formatDb(value: number | null, suffix = "dB") {
  return value === null || value <= -89 ? "---" : `${value.toFixed(1)} ${suffix}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function titleCase(value: string | null) {
  if (!value) return "Unavailable";
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function meterSegments(levelDb: number, online: boolean) {
  if (!online || levelDb <= METER_FLOOR_DB) return 0;
  return Math.max(
    0,
    Math.min(
      METER_SEGMENTS,
      Math.round(((Math.min(0, levelDb) - METER_FLOOR_DB) / Math.abs(METER_FLOOR_DB)) * METER_SEGMENTS),
    ),
  );
}

function statusTone(tone: "good" | "warn" | "bad" | "idle") {
  if (tone === "good") return "text-lime-400";
  if (tone === "warn") return "text-amber-300";
  if (tone === "bad") return "text-red-400";
  return "text-white/38";
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "warn" | "bad" | "idle";
}) {
  const Icon = tone === "good" ? CircleCheck : tone === "warn" ? AlertTriangle : tone === "bad" ? CircleX : Activity;
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 border-b border-white/8 px-3 py-2 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate font-body text-xs text-white/75">{label}</p>
        <p className={`mt-0.5 truncate font-ui text-[0.56rem] font-black uppercase ${statusTone(tone)}`}>
          {value}
        </p>
      </div>
      <Icon className={`h-4 w-4 shrink-0 ${statusTone(tone)}`} aria-hidden />
    </div>
  );
}

function PresetButton({
  preset,
  disabled,
  onClick,
  compact = false,
}: {
  preset: AudioPresetStatus;
  disabled: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled || !preset.configured || preset.active}
      onClick={onClick}
      aria-pressed={preset.active}
      className={`border px-3 text-left transition disabled:cursor-not-allowed ${
        compact ? "min-h-11" : "min-h-20"
      } ${
        preset.active
          ? "border-lime-400 bg-lime-400/10 text-lime-300"
          : preset.configured
            ? "border-cyan-400/55 bg-cyan-400/[0.04] text-white hover:bg-cyan-400/10"
            : "border-white/18 bg-white/[0.02] text-white/45"
      } disabled:opacity-60`}
    >
      <span className={`block font-ui font-black uppercase ${compact ? "text-[0.62rem]" : "text-sm"}`}>
        {preset.label}
      </span>
      <span
        className={`mt-1 block font-ui text-[0.55rem] font-bold uppercase ${
          preset.active ? "text-lime-400" : preset.configured ? "text-cyan-300" : "text-white/40"
        }`}
      >
        {preset.active ? "Active" : preset.configured ? "Ready" : "Unmapped"}
      </span>
    </button>
  );
}

function LoudnessTile({
  label,
  value,
  suffix,
  tone = "normal",
}: {
  label: string;
  value: number | null;
  suffix: string;
  tone?: "normal" | "warn" | "danger";
}) {
  const valueTone = tone === "danger" ? "text-red-400" : tone === "warn" ? "text-amber-300" : "text-lime-400";
  return (
    <div className="grid min-h-24 content-center border border-[#26323a] bg-[#05090c] px-3 text-center">
      <p className="font-ui text-[0.58rem] font-bold uppercase text-white/62">{label}</p>
      <p className={`mt-2 font-ui text-xl font-black ${value === null ? "text-white/35" : valueTone}`}>
        {value === null ? "---" : value.toFixed(1)}
      </p>
      <p className={`mt-1 font-ui text-[0.55rem] font-bold ${value === null ? "text-white/28" : valueTone}`}>
        {suffix}
      </p>
    </div>
  );
}

function BusMeterCard({
  bus,
  online,
  disabled,
  onRequestMute,
}: {
  bus: OwnerAudioBusTelemetry;
  online: boolean;
  disabled: boolean;
  onRequestMute: () => void;
}) {
  const activeSegments = meterSegments(bus.levelDb, online);
  const hot = bus.levelDb >= -3;
  const warning = bus.limiterActive;
  return (
    <article className="grid min-h-[25rem] grid-rows-[auto_auto_minmax(0,1fr)_auto_auto] border border-[#344149] bg-[#05090c]">
      <h3 className="border-b border-[#26323a] px-2 py-2 text-center font-ui text-[0.68rem] font-black uppercase text-white/90">
        {bus.label}
      </h3>
      <div className={`flex min-h-8 items-center justify-center gap-1.5 font-ui text-[0.52rem] font-bold uppercase ${
        bus.muted ? "text-red-400" : warning ? "text-amber-300" : online ? "text-lime-400" : "text-white/35"
      }`}>
        <span className={`h-2 w-2 rounded-full ${
          bus.muted ? "bg-red-400" : warning ? "bg-amber-300" : online ? "bg-lime-400" : "bg-white/25"
        }`} />
        {bus.muted ? "Muted" : warning ? "Limiter Active" : online ? "Online" : "Offline"}
      </div>
      <div className="grid min-h-56 grid-cols-[2rem_2.2rem] justify-center gap-2 px-2 py-2">
        <div className="flex flex-col justify-between text-right font-ui text-[0.48rem] leading-none text-white/55">
          {METER_STEPS.map((step) => <span key={step}>{step}</span>)}
        </div>
        <div className="flex min-h-0 flex-col-reverse gap-[2px] border-x border-white/8 bg-black/60 px-1 py-1">
          {Array.from({ length: METER_SEGMENTS }).map((_, index) => {
            const active = index < activeSegments;
            const color = index >= 22 ? "bg-red-500" : index >= 17 ? "bg-amber-300" : "bg-lime-500";
            return <span key={index} className={`min-h-0 flex-1 ${active ? color : "bg-white/7"}`} />;
          })}
        </div>
      </div>
      <p className={`pb-3 text-center font-ui text-xl font-black ${hot ? "text-red-400" : online ? "text-white" : "text-white/30"}`}>
        {formatDb(online ? bus.levelDb : null)}
      </p>
      <button
        type="button"
        disabled={disabled || !online}
        onClick={onRequestMute}
        className={`mx-3 mb-3 flex min-h-10 items-center justify-center gap-2 border font-ui text-[0.62rem] font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-40 ${
          bus.muted
            ? "border-lime-400/55 bg-lime-400/10 text-lime-300 hover:bg-lime-400/20"
            : "border-white/25 bg-white/[0.02] text-white/78 hover:border-amber-300/60 hover:text-amber-200"
        }`}
      >
        {bus.muted ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        {bus.muted ? "Unmute" : "Mute"}
      </button>
    </article>
  );
}

function InfoCell({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-h-14 min-w-0 items-center gap-2 border-r border-[#26323a] px-3 last:border-r-0">
      <span className="shrink-0 text-white/55">{icon}</span>
      <span className="min-w-0">
        <span className="block truncate font-ui text-[0.48rem] font-bold uppercase text-white/42">{label}</span>
        <span className="mt-0.5 block truncate font-body text-[0.64rem] text-white/76">{value}</span>
      </span>
    </div>
  );
}

export default function OwnerSoundControlClient({ initialOperatorEmail }: { initialOperatorEmail: string }) {
  const [telemetry, setTelemetry] = useState<OwnerAudioTelemetry | null>(null);
  const [presets, setPresets] = useState<AudioPresetStatus[]>(DEFAULT_PRESETS);
  const [operatorEmail, setOperatorEmail] = useState(initialOperatorEmail);
  const [showTitle, setShowTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commandLoading, setCommandLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [now, setNow] = useState(() => new Date());
  const requestInFlight = useRef(false);

  const loadWorkspace = useCallback(async (silent = false) => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    if (!silent) setLoading(true);
    setRefreshing(silent);

    try {
      const response = await fetch("/api/owner/audio/mix-state", {
        credentials: "include",
        cache: "no-store",
      });
      const json = (await response.json()) as AudioMixStateResponse;
      if (!response.ok || !json.telemetry || !json.presets) {
        throw new Error(json.error || "Unable to load sound control telemetry.");
      }

      setTelemetry(json.telemetry);
      setPresets(json.presets);
      if (json.operatorEmail) setOperatorEmail(json.operatorEmail);
      setShowTitle(json.showTitle ?? null);
      setLoadError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load sound control telemetry.";
      setLoadError(message);
      if (!silent) setToast({ tone: "error", message });
    } finally {
      setLoading(false);
      setRefreshing(false);
      requestInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadWorkspace(), 0);
    const interval = window.setInterval(() => void loadWorkspace(true), 4_000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [loadWorkspace]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4_500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const runPendingAction = useCallback(async () => {
    if (!pendingAction || commandLoading) return;
    setCommandLoading(true);

    const body =
      pendingAction.kind === "preset"
        ? { command: "apply_preset", presetId: pendingAction.presetId }
        : {
            command: "set_bus_mute",
            busKey: pendingAction.busKey,
            muted: pendingAction.muted,
          };

    try {
      const response = await fetch("/api/owner/audio/mix-state", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await response.json()) as AudioMixStateResponse;
      if (!response.ok || !json.telemetry || !json.presets) {
        throw new Error(json.error || "Audio control command failed.");
      }

      setTelemetry(json.telemetry);
      setPresets(json.presets);
      setToast({ tone: "success", message: json.message || "Audio control command acknowledged." });
      setPendingAction(null);
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Audio control command failed.",
      });
    } finally {
      setCommandLoading(false);
    }
  }, [commandLoading, pendingAction]);

  const buses = telemetry?.buses ?? EMPTY_BUSES;
  const x32Online = telemetry?.console.online === true;
  const controlsDisabled = !x32Online || !telemetry?.edgeReachable || commandLoading;
  const activePreset = presets.find((preset) => preset.active) ?? null;
  const streamBus = buses.find((bus) => bus.key === "stream_mix") ?? null;
  const monitorBuses = ["lr_master", "stream_mix", "monitor_mix"]
    .map((key) => buses.find((bus) => bus.key === key))
    .filter((bus): bus is OwnerAudioBusTelemetry => Boolean(bus));
  const heartbeatAt = telemetry?.console.lastHeartbeatAt ?? null;
  const telemetryFresh = useMemo(() => {
    if (!heartbeatAt) return false;
    const timestamp = Date.parse(heartbeatAt);
    return Number.isFinite(timestamp) && now.getTime() - timestamp < 15_000;
  }, [heartbeatAt, now]);

  const pendingLabel = pendingAction
    ? pendingAction.kind === "preset"
      ? `Recall ${pendingAction.label}?`
      : `${pendingAction.muted ? "Mute" : "Unmute"} ${pendingAction.label}?`
    : null;

  if (loading && !telemetry) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#020405] text-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-cyan-300" />
          <p className="mt-3 font-ui text-xs font-black uppercase tracking-[0.14em] text-white/60">
            Loading Sound Control
          </p>
        </div>
      </main>
    );
  }

  return (
    <main data-testid="sound-control-page" className="min-h-dvh overflow-x-hidden bg-[#020405] p-2 text-white">
      <header className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-[#26323a] px-2 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/owner/cockpit"
            aria-label="Back to production cockpit"
            title="Back to production cockpit"
            className="grid h-9 w-9 shrink-0 place-items-center border border-cyan-400/35 text-cyan-300 hover:bg-cyan-400/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <AudioLines className="h-7 w-7 shrink-0 text-cyan-300" aria-hidden />
          <h1 className="truncate font-headline text-2xl uppercase tracking-[0.04em] text-white sm:text-3xl">
            Sound Control &amp; Monitor
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <time className="hidden font-ui text-xs text-white/58 sm:block">
            {now.toLocaleTimeString("en-US")}
          </time>
          <button
            type="button"
            onClick={() => void loadWorkspace(true)}
            disabled={refreshing}
            className="inline-flex min-h-9 items-center justify-center gap-2 border border-cyan-400/45 px-3 font-ui text-[0.62rem] font-black uppercase text-cyan-300 hover:bg-cyan-400/10 disabled:opacity-45"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      {loadError ? (
        <div role="alert" className="mt-2 border border-red-400/35 bg-red-400/8 px-3 py-2 font-body text-xs text-red-200">
          {loadError}
        </div>
      ) : null}

      <div className="mt-2 grid gap-2 xl:grid-cols-[14rem_minmax(0,1fr)_14rem]">
        <aside className="grid content-start gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <Panel title="System Status">
            <StatusRow label="X32 Console" value={x32Online ? "Connected" : "Offline"} tone={x32Online ? "good" : "bad"} />
            <StatusRow label="Audio Edge" value={telemetry?.edgeReachable ? "Reachable" : "Unavailable"} tone={telemetry?.edgeReachable ? "good" : "bad"} />
            <StatusRow label="Telemetry" value={telemetryFresh ? "Fresh" : "Stale"} tone={telemetryFresh ? "good" : telemetry?.edgeReachable ? "warn" : "bad"} />
            <StatusRow label="Stream Mix" value={streamBus?.muted ? "Muted" : x32Online ? "Active" : "Unavailable"} tone={streamBus?.muted ? "bad" : x32Online ? "good" : "idle"} />
            <StatusRow label="Loudness" value={titleCase(telemetry?.loudness.measurementMode ?? null)} tone={telemetry?.loudness.measurementMode === "measured" ? "good" : telemetry?.loudness.measurementMode === "estimated" ? "warn" : "idle"} />
          </Panel>

          <Panel title="Scene Management">
            <div className="p-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={controlsDisabled || !preset.configured || preset.active}
                  onClick={() => setPendingAction({ kind: "preset", presetId: preset.id, label: preset.label })}
                  className={`flex min-h-11 w-full items-center justify-between border-b border-white/8 px-2 text-left font-ui text-[0.62rem] font-bold uppercase last:border-b-0 disabled:cursor-not-allowed ${
                    preset.active ? "bg-cyan-400/10 text-lime-400" : "text-white/78 disabled:text-white/36"
                  }`}
                >
                  <span>{preset.label}</span>
                  <span className={preset.active ? "text-lime-400" : preset.configured ? "text-cyan-300" : "text-white/35"}>
                    {preset.active ? "Active" : preset.configured ? "Ready" : "Unmapped"}
                  </span>
                </button>
              ))}
              <p className="mt-2 border-t border-white/8 px-2 pt-2 font-body text-[0.62rem] text-white/42">
                Current: {activePreset?.label || telemetry?.consoleScene.name || "No mapped scene"}
              </p>
            </div>
          </Panel>

          <Panel title="Control Boundary" className="sm:col-span-2 xl:col-span-1">
            <div className="space-y-2 p-3 font-body text-[0.66rem] leading-relaxed text-white/56">
              <p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" /> X32 remains authoritative.</p>
              <p className="flex items-start gap-2"><Server className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" /> Commands require the owner session and edge token.</p>
            </div>
          </Panel>
        </aside>

        <section className="min-w-0 space-y-2">
          <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border border-[#26323a] bg-[#05090c] px-4">
            <div className={`inline-flex items-center gap-2 font-ui text-sm font-black uppercase ${x32Online ? "text-lime-400" : "text-red-400"}`}>
              <span className={`h-3 w-3 rounded-full ${x32Online ? "bg-lime-400" : "bg-red-400"}`} />
              {x32Online ? "X32 Connected" : "X32 Offline"}
            </div>
            <p className="font-ui text-xs uppercase text-white/55">
              Scene: <span className="ml-1 font-black text-cyan-300">{activePreset?.label || telemetry?.consoleScene.name || "Unavailable"}</span>
            </p>
          </div>

          <div className="grid gap-2 2xl:grid-cols-[minmax(0,1fr)_25rem]">
            <Panel title="Mix Preset">
              <div className="grid gap-2 p-3 sm:grid-cols-3">
                {presets.map((preset) => (
                  <PresetButton
                    key={preset.id}
                    preset={preset}
                    disabled={controlsDisabled}
                    onClick={() => setPendingAction({ kind: "preset", presetId: preset.id, label: preset.label })}
                  />
                ))}
              </div>
            </Panel>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:gap-2">
              <LoudnessTile label={telemetry?.loudness.measurementMode === "estimated" ? "Int. Est." : "Int. LUFS"} value={telemetry?.loudness.integratedLufs ?? null} suffix="LUFS" />
              <LoudnessTile label={telemetry?.loudness.measurementMode === "estimated" ? "Short Est." : "Short LUFS"} value={telemetry?.loudness.shortTermLufs ?? null} suffix="LUFS" />
              <LoudnessTile label={telemetry?.loudness.measurementMode === "estimated" ? "Peak Est." : "True Peak"} value={telemetry?.loudness.truePeakDb ?? null} suffix={telemetry?.loudness.measurementMode === "measured" ? "dBTP" : "dB"} tone={(telemetry?.loudness.truePeakDb ?? -90) >= -2 ? "danger" : "normal"} />
              <div className="grid min-h-24 content-center border border-[#26323a] bg-[#05090c] px-2 text-center">
                <p className="font-ui text-[0.58rem] font-bold uppercase text-white/62">Limiter</p>
                <p className={`mt-2 font-ui text-sm font-black uppercase ${telemetry?.streamSafety.limiterActive ? "text-red-400" : "text-lime-400"}`}>
                  {telemetry?.streamSafety.limiterActive ? "Reducing" : "Clear"}
                </p>
                <p className="mt-1 font-ui text-[0.5rem] uppercase text-white/35">Stream Mix</p>
              </div>
            </div>
          </div>

          {pendingAction ? (
            <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border border-amber-300/55 bg-amber-300/[0.04] px-3">
              <p className="inline-flex items-center gap-2 font-ui text-xs font-black uppercase text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                {pendingLabel}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" disabled={commandLoading} onClick={() => setPendingAction(null)} className="min-h-9 border border-white/30 px-4 font-ui text-[0.62rem] font-black uppercase text-white/72 hover:bg-white/8 disabled:opacity-45">
                  Cancel
                </button>
                <button type="button" disabled={commandLoading} onClick={() => void runPendingAction()} className="inline-flex min-h-9 items-center justify-center gap-2 border border-amber-300 bg-amber-300/10 px-4 font-ui text-[0.62rem] font-black uppercase text-amber-200 hover:bg-amber-300/20 disabled:opacity-45">
                  {commandLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Confirm
                </button>
              </div>
            </div>
          ) : null}

          <Panel title="X32 Live Bus Matrix (5 CH)">
            <div data-testid="sound-bus-matrix" className="grid gap-2 p-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              {buses.map((bus) => (
                <BusMeterCard
                  key={bus.key}
                  bus={bus}
                  online={x32Online}
                  disabled={controlsDisabled}
                  onRequestMute={() => setPendingAction({ kind: "mute", busKey: bus.key, label: bus.label, muted: !bus.muted })}
                />
              ))}
            </div>
          </Panel>
        </section>

        <aside className="grid content-start gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <Panel title="Scene Recall">
            <div className="space-y-2 p-2">
              {presets.map((preset) => (
                <PresetButton
                  key={preset.id}
                  preset={preset}
                  compact
                  disabled={controlsDisabled}
                  onClick={() => setPendingAction({ kind: "preset", presetId: preset.id, label: preset.label })}
                />
              ))}
            </div>
          </Panel>

          <Panel title="Monitoring">
            <div className="p-2">
              {monitorBuses.map((bus) => (
                <div key={bus.key} className="flex min-h-11 items-center justify-between gap-2 border-b border-white/8 px-2 last:border-b-0">
                  <span className="truncate font-body text-xs text-white/70">{bus.label}</span>
                  <span className={`shrink-0 font-ui text-[0.62rem] font-black ${bus.muted ? "text-red-400" : x32Online ? "text-lime-400" : "text-white/35"}`}>
                    {bus.muted ? "MUTED" : formatDb(x32Online ? bus.levelDb : null)}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Edge Health" className="sm:col-span-2 xl:col-span-1">
            <div className="p-2">
              <StatusRow label="Health Score" value={telemetry?.healthScore === null || telemetry?.healthScore === undefined ? "Unavailable" : `${telemetry.healthScore}%`} tone={(telemetry?.healthScore ?? 0) >= 80 ? "good" : telemetry?.healthScore !== null && telemetry?.healthScore !== undefined ? "warn" : "idle"} />
              <StatusRow label="Sample Rate" value={telemetry?.console.sampleRateHz ? `${telemetry.console.sampleRateHz / 1000} kHz` : "Unavailable"} tone={telemetry?.console.sampleRateHz === 48000 ? "good" : "idle"} />
              <StatusRow label="Clock Source" value={titleCase(telemetry?.console.clockSource ?? null)} tone={telemetry?.console.clockSource ? "good" : "idle"} />
              <StatusRow label="OSC Latency" value={telemetry?.console.oscLatencyMs === null || telemetry?.console.oscLatencyMs === undefined ? "Unavailable" : `${telemetry.console.oscLatencyMs.toFixed(1)} ms`} tone={(telemetry?.console.oscLatencyMs ?? 999) < 100 ? "good" : telemetry?.console.oscLatencyMs !== null && telemetry?.console.oscLatencyMs !== undefined ? "warn" : "idle"} />
            </div>
          </Panel>
        </aside>
      </div>

      <section className="mt-2 grid border border-[#26323a] bg-[#05090c] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <InfoCell icon={<Radio className="h-4 w-4" />} label="Sample Rate" value={telemetry?.console.sampleRateHz ? `${telemetry.console.sampleRateHz / 1000} kHz` : "Unavailable"} />
        <InfoCell icon={<Clock3 className="h-4 w-4" />} label="Clock Source" value={titleCase(telemetry?.console.clockSource ?? null)} />
        <InfoCell icon={<Activity className="h-4 w-4" />} label="Last Heartbeat" value={formatDateTime(heartbeatAt)} />
        <InfoCell icon={<UserRound className="h-4 w-4" />} label="Operator" value={operatorEmail} />
        <InfoCell icon={<Music2 className="h-4 w-4" />} label="Show" value={showTitle || "Unavailable"} />
        <InfoCell icon={<Gauge className="h-4 w-4" />} label="Firmware" value={telemetry?.console.firmwareVersion || "Unavailable"} />
      </section>

      <footer className="mt-2 flex min-h-14 items-center justify-center gap-3 border border-cyan-400/65 bg-cyan-400/[0.025] px-4 text-center">
        <ShieldCheck className="h-7 w-7 text-cyan-300" aria-hidden />
        <p className="font-ui text-sm font-black uppercase tracking-[0.14em] text-cyan-300 sm:text-base">
          Edge Audio Remains Authoritative
        </p>
      </footer>

      {toast ? (
        <div
          role={toast.tone === "error" ? "alert" : "status"}
          className={`fixed bottom-4 right-4 z-50 max-w-sm border px-4 py-3 font-body text-sm shadow-2xl ${
            toast.tone === "error"
              ? "border-red-400/55 bg-[#190609] text-red-100"
              : "border-lime-400/55 bg-[#071407] text-lime-100"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </main>
  );
}
