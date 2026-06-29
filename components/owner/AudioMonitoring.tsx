"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Boxes,
  Cloud,
  Gauge,
  HeartPulse,
  Home,
  Mic,
  Music2,
  Radio,
  RefreshCw,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Users,
  Volume2,
  Waves,
} from "lucide-react";
import { useDeviceInventoryStore } from "@/hooks/use-device-inventory-store";
import { useProductionLiveStore, useProductionLiveSync } from "@/hooks/use-production-live-data";
import {
  CONCERT_EQ_PRESET_LABELS,
  type AudioLevelTrack,
  type ConcertEqPreset,
  type OwnerAudioConfig,
} from "@/lib/owner/audio-contracts";

type AudioMonitoringProps = {
  config: OwnerAudioConfig;
  tracks: AudioLevelTrack[];
  mediaNodeStatus?: "online" | "offline" | "degraded";
  mediaNodeDetail?: string | null;
  actionMessage?: string | null;
  errorMessage?: string | null;
  configPending?: boolean;
  onConfigChange: (patch: Partial<OwnerAudioConfig>) => void;
};

type ChannelState = {
  id: string;
  label: string;
  icon: "mic" | "choir" | "keys" | "bass" | "drums" | "music" | "audience" | "master";
  level: number;
  solo: boolean;
  mute: boolean;
};

type LocalSoundHubState = {
  selectedScene: string;
  monitorOutput: string;
  quickAdjust: {
    voiceClarity: number;
    musicLevel: number;
    bassControl: number;
    reverb: number;
    audienceAmbience: number;
  };
  toolStates: Record<string, boolean>;
  channels: ChannelState[];
};

const SOUND_HUB_STORAGE_KEY = "300-awakening-sound-hub-live-v1";

const defaultChannels: ChannelState[] = [
  { id: "lead-vocal", label: "Lead Vocal", icon: "mic", level: 78, solo: false, mute: false },
  { id: "choir", label: "Choir", icon: "choir", level: 76, solo: false, mute: false },
  { id: "pastor-mic", label: "Pastor Mic", icon: "mic", level: 75, solo: false, mute: false },
  { id: "keys", label: "Keys", icon: "keys", level: 66, solo: false, mute: false },
  { id: "bass", label: "Bass", icon: "bass", level: 68, solo: false, mute: false },
  { id: "drums", label: "Drums", icon: "drums", level: 63, solo: false, mute: false },
  { id: "playback", label: "Playback", icon: "music", level: 61, solo: false, mute: false },
  { id: "audience", label: "Audience", icon: "audience", level: 57, solo: false, mute: false },
  { id: "main-mix", label: "Main Mix L/R", icon: "master", level: 78, solo: false, mute: false },
];

const defaultSoundHubState: LocalSoundHubState = {
  selectedScene: "Worship Set",
  monitorOutput: "Main Mix L/R",
  quickAdjust: {
    voiceClarity: 80,
    musicLevel: 65,
    bassControl: 55,
    reverb: 40,
    audienceAmbience: 60,
  },
  toolStates: {
    feedbackFinder: true,
    noiseGateAssistant: true,
    smartEqMatch: true,
    headroomManager: true,
    loudnessOptimizer: true,
  },
  channels: defaultChannels,
};

const scenes = ["Opening Prayer", "Worship Set", "Message", "Offering", "Altar Call", "Closing"];
const navItems = ["Overview", "Control", "Dashboard", "Sources", "Mixer", "Effects", "Scenes", "Monitors", "Automation", "Reports", "Settings"];
const eqPresets: ConcertEqPreset[] = ["spoken_word", "full_choir", "acoustic_prayer"];

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function dbToPercent(db: number): number {
  return clampPercent(((Math.max(-60, Math.min(0, db)) + 60) / 60) * 100);
}

function levelToDb(level: number): number {
  return Number((-18 + (clampPercent(level) - 50) * 0.32).toFixed(1));
}

function sanitizeSoundHubState(value: unknown): LocalSoundHubState {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const quick = record.quickAdjust && typeof record.quickAdjust === "object"
    ? (record.quickAdjust as Partial<LocalSoundHubState["quickAdjust"]>)
    : {};
  const toolStates = record.toolStates && typeof record.toolStates === "object"
    ? (record.toolStates as Record<string, unknown>)
    : {};
  const rawChannels = Array.isArray(record.channels) ? record.channels : defaultChannels;

  return {
    selectedScene: typeof record.selectedScene === "string" && scenes.includes(record.selectedScene)
      ? record.selectedScene
      : defaultSoundHubState.selectedScene,
    monitorOutput: typeof record.monitorOutput === "string" && record.monitorOutput.trim()
      ? record.monitorOutput.slice(0, 48)
      : defaultSoundHubState.monitorOutput,
    quickAdjust: {
      voiceClarity: clampPercent(Number(quick.voiceClarity ?? defaultSoundHubState.quickAdjust.voiceClarity)),
      musicLevel: clampPercent(Number(quick.musicLevel ?? defaultSoundHubState.quickAdjust.musicLevel)),
      bassControl: clampPercent(Number(quick.bassControl ?? defaultSoundHubState.quickAdjust.bassControl)),
      reverb: clampPercent(Number(quick.reverb ?? defaultSoundHubState.quickAdjust.reverb)),
      audienceAmbience: clampPercent(Number(quick.audienceAmbience ?? defaultSoundHubState.quickAdjust.audienceAmbience)),
    },
    toolStates: Object.fromEntries(
      Object.entries(defaultSoundHubState.toolStates).map(([key, fallback]) => [
        key,
        typeof toolStates[key] === "boolean" ? toolStates[key] : fallback,
      ]),
    ),
    channels: rawChannels.slice(0, 9).map((channel, index) => {
      const source = channel && typeof channel === "object" ? (channel as Partial<ChannelState>) : {};
      const fallback = defaultChannels[index] ?? defaultChannels[0];
      return {
        id: typeof source.id === "string" && source.id.trim() ? source.id.slice(0, 40) : fallback.id,
        label: typeof source.label === "string" && source.label.trim()
          ? source.label.replace(/<[^>]*>/g, "").slice(0, 32)
          : fallback.label,
        icon: source.icon ?? fallback.icon,
        level: clampPercent(Number(source.level ?? fallback.level)),
        solo: typeof source.solo === "boolean" ? source.solo : false,
        mute: typeof source.mute === "boolean" ? source.mute : false,
      };
    }),
  };
}

function readSoundHubState(): LocalSoundHubState {
  if (typeof window === "undefined") return defaultSoundHubState;
  try {
    const stored = window.localStorage.getItem(SOUND_HUB_STORAGE_KEY);
    return stored ? sanitizeSoundHubState(JSON.parse(stored)) : defaultSoundHubState;
  } catch {
    return defaultSoundHubState;
  }
}

function writeSoundHubState(state: LocalSoundHubState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SOUND_HUB_STORAGE_KEY, JSON.stringify(sanitizeSoundHubState(state)));
  } catch {
    return;
  }
}

function ChannelIcon({ type }: { type: ChannelState["icon"] }) {
  const className = "mx-auto h-7 w-7 text-[#C566FF]";
  if (type === "choir") return <Users className={className} />;
  if (type === "keys") return <SlidersHorizontal className={className} />;
  if (type === "bass") return <Music2 className={className} />;
  if (type === "drums") return <Activity className={className} />;
  if (type === "music") return <Music2 className={className} />;
  if (type === "audience") return <Users className={className} />;
  if (type === "master") return <BarChart3 className={className} />;
  return <Mic className={className} />;
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[8px] border border-[#1B2B4C] bg-[#060B17]/92 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_24px_rgba(0,0,0,0.35)] ${className}`}>
      <h2 className="font-ui text-sm font-bold uppercase tracking-[0.04em] text-[#E387FF]">{title}</h2>
      {children}
    </section>
  );
}

function MiniSwitch({ checked, disabled, onClick, dataTestId }: { checked: boolean; disabled?: boolean; onClick: () => void; dataTestId: string }) {
  return (
    <button
      data-testid={dataTestId}
      type="button"
      disabled={disabled}
      aria-pressed={checked}
      onClick={onClick}
      className={`rounded-[5px] border px-2 py-1 font-ui text-[0.62rem] uppercase disabled:opacity-45 ${
        checked ? "border-[#22E66B]/50 bg-[#062814] text-[#22E66B]" : "border-[#2A3554] bg-[#0A1120] text-white/45"
      }`}
    >
      {checked ? "On" : "Off"}
    </button>
  );
}

function RotaryControl({
  label,
  value,
  disabled,
  dataTestId,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  dataTestId: string;
  onChange: (value: number) => void;
}) {
  const angle = -135 + (clampPercent(value) / 100) * 270;
  return (
    <label className="flex flex-col items-center gap-2">
      <span className="relative grid h-20 w-20 place-items-center rounded-full border-[6px] border-[#243350] bg-[#070D1A] shadow-[0_0_18px_rgba(138,46,255,0.28)]">
        <span className="absolute inset-[-6px] rounded-full border-t-[#42B6FF] border-r-[#8A2EFF] border-b-[#0A1424] border-l-[#C84CFF] border-[6px]" />
        <span
          className="absolute h-7 w-1 origin-bottom rounded-full bg-white"
          style={{ transform: `rotate(${angle}deg) translateY(-17px)` }}
        />
        <input
          data-testid={dataTestId}
          type="range"
          min={0}
          max={100}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(clampPercent(Number(event.target.value)))}
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
      </span>
      <span className="text-center font-body text-xs text-white">{label}</span>
      <span className="font-body text-xs text-white/70">{value}%</span>
    </label>
  );
}

export default function AudioMonitoring({
  config,
  tracks,
  mediaNodeStatus = "degraded",
  mediaNodeDetail = null,
  actionMessage = null,
  errorMessage = null,
  configPending = false,
  onConfigChange,
}: AudioMonitoringProps) {
  useProductionLiveSync();
  const [localState, setLocalState] = useState<LocalSoundHubState>(defaultSoundHubState);
  const [statusMessage, setStatusMessage] = useState("Sound Hub ready.");
  const { microphones, error: inventoryError } = useDeviceInventoryStore();
  const audioChannels = useProductionLiveStore((state) => state.audioChannels);
  const updateFaderState = useProductionLiveStore((state) => state.updateFaderState);

  useEffect(() => {
    if (!audioChannels.length) return;
    setLocalState((current) =>
      sanitizeSoundHubState({
        ...current,
        channels: current.channels.map((channel) => {
          const synced = audioChannels.find((item) => item.channel_id === channel.id);
          return synced
            ? {
                ...channel,
                label: synced.label,
                level: synced.level,
                solo: synced.solo,
                mute: synced.mute,
              }
            : channel;
        }),
      }),
    );
  }, [audioChannels]);

  useEffect(() => {
    setLocalState(readSoundHubState());
  }, []);

  const persistLocalState = useCallback((updater: (current: LocalSoundHubState) => LocalSoundHubState, message: string) => {
    setLocalState((current) => {
      const next = sanitizeSoundHubState(updater(current));
      writeSoundHubState(next);
      return next;
    });
    setStatusMessage(message);
  }, []);

  const channelTelemetry = useMemo(
    () =>
      localState.channels.map((channel, index) => {
        const track = tracks[index % Math.max(tracks.length, 1)];
        const levelPct = track ? dbToPercent(track.levelDb) : channel.level;
        const peakPct = track ? dbToPercent(track.peakDb) : Math.min(100, channel.level + 10);
        return { ...channel, levelPct, peakPct, db: levelToDb(channel.level) };
      }),
    [localState.channels, tracks],
  );

  const connectedMicCount = microphones.filter((device) => device.healthStatus === "LINKED").length;
  const systemHealth = mediaNodeStatus === "online" ? "Optimal" : mediaNodeStatus === "offline" ? "Offline" : "Degraded";
  const statusTone = mediaNodeStatus === "online" ? "text-[#22E66B]" : mediaNodeStatus === "offline" ? "text-red-300" : "text-amber-300";
  const loudness = (-16 + (config.masterLimiterCompressor - 72) * 0.03).toFixed(1);

  const handleChannelLevel = useCallback(
    (id: string, level: number) => {
      const channel = localState.channels.find((item) => item.id === id);
      persistLocalState(
        (current) => ({
          ...current,
          channels: current.channels.map((channel) =>
            channel.id === id ? { ...channel, level: clampPercent(level) } : channel,
          ),
        }),
        "Channel fader saved to production mix state.",
      );
      void updateFaderState(id, clampPercent(level), channel?.mute ?? false, channel?.solo ?? false, channel?.label ?? id);
    },
    [localState.channels, persistLocalState, updateFaderState],
  );

  const toggleChannelFlag = useCallback(
    (id: string, flag: "solo" | "mute") => {
      const channel = localState.channels.find((item) => item.id === id);
      const nextMute = flag === "mute" ? !(channel?.mute ?? false) : (channel?.mute ?? false);
      const nextSolo = flag === "solo" ? !(channel?.solo ?? false) : (channel?.solo ?? false);
      persistLocalState(
        (current) => ({
          ...current,
          channels: current.channels.map((channel) =>
            channel.id === id ? { ...channel, [flag]: !channel[flag] } : channel,
          ),
        }),
        `${flag === "solo" ? "Solo" : "Mute"} state saved to production mix state.`,
      );
      void updateFaderState(id, channel?.level ?? 75, nextMute, nextSolo, channel?.label ?? id);
    },
    [localState.channels, persistLocalState, updateFaderState],
  );

  const handleSmartMix = useCallback(() => {
    persistLocalState(
      (current) => ({
        ...current,
        selectedScene: "Worship Set",
        quickAdjust: {
          voiceClarity: 82,
          musicLevel: 66,
          bassControl: 58,
          reverb: 42,
          audienceAmbience: 62,
        },
        channels: current.channels.map((channel) => ({
          ...channel,
          level: channel.id === "main-mix" ? 79 : Math.max(55, Math.min(80, channel.level + 2)),
        })),
      }),
      "Smart mix applied to local Sound Hub state.",
    );
    onConfigChange({ aiGainGuardEnabled: true, concertEqPreset: "full_choir", masterLimiterCompressor: 74 });
  }, [onConfigChange, persistLocalState]);

  const handlePresetChange = useCallback(
    (preset: ConcertEqPreset) => {
      onConfigChange({ concertEqPreset: preset });
      setStatusMessage(`${CONCERT_EQ_PRESET_LABELS[preset]} profile sent to audio services.`);
    },
    [onConfigChange],
  );

  return (
    <main className="min-h-dvh bg-[#02040A] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(0,221,235,0.09),transparent_25%),radial-gradient(circle_at_78%_10%,rgba(255,47,207,0.12),transparent_28%),linear-gradient(180deg,#030611,#02040A)]" />
      <div className="relative grid min-h-dvh 2xl:grid-cols-[11.75rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#17233B] bg-[#050812]/92 2xl:flex 2xl:flex-col">
          <div className="flex h-24 items-center gap-3 border-b border-[#17233B] px-5">
            <div className="grid h-11 w-11 place-items-center rounded-[8px] border border-[#42B6FF] font-headline text-4xl text-transparent [-webkit-text-stroke:1px_#FF4CDA]">P</div>
            <div>
              <p className="font-body text-lg uppercase tracking-[0.28em]">Parable</p>
              <p className="font-body text-[0.62rem] uppercase tracking-[0.4em] text-white/60">Entertainment</p>
            </div>
          </div>
          <nav className="flex-1 py-4">
            {navItems.map((item) => {
              const active = item === "Control";
              return (
                <Link
                  key={item}
                  data-testid={`sound-hub-nav-${item.toLowerCase()}`}
                  href={item === "Control" ? "/owner/audio-monitoring" : item === "Mixer" ? "/owner/audio-mixing" : "/owner/show-setup"}
                  className={`flex min-h-13 items-center gap-4 border-l-2 px-5 font-body text-sm uppercase ${
                    active ? "border-[#FF2FCF] bg-[#251033] text-white" : "border-transparent text-white/72 hover:bg-white/5"
                  }`}
                >
                  {item === "Overview" ? <Home className="h-5 w-5" /> : item === "Control" ? <Radio className="h-5 w-5" /> : <Boxes className="h-5 w-5" />}
                  {item}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-[#17233B] p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full border border-[#FF4CDA] font-headline text-2xl text-transparent [-webkit-text-stroke:1px_#00DDEB]">P</div>
              <div>
                <p className="font-body text-sm font-bold">Producer</p>
                <p className="font-body text-xs text-white/55">Owner</p>
                <p className="mt-2 font-body text-xs text-[#22E66B]">Online</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="col-span-1 xl:col-span-1">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#17233B] px-3 py-4 sm:px-5">
            <div>
              <h1 className="font-headline text-3xl uppercase tracking-[0.02em] sm:text-4xl">
                Sound <span className="bg-gradient-to-r from-[#FF4CDA] to-[#42B6FF] bg-clip-text text-transparent">Hub</span>
              </h1>
              <p className="font-body text-sm uppercase tracking-[0.08em] text-white/75">AI Mixing. Level Control. Broadcast Sound.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="grid w-full grid-cols-1 rounded-[8px] border border-[#17233B] bg-[#050B16] sm:grid-cols-3 xl:w-auto">
                <div className="flex items-center gap-3 border-b border-[#17233B] px-3 py-3 sm:border-b-0 sm:border-r xl:px-5">
                  <HeartPulse className="h-6 w-6 text-[#22E66B]" />
                  <div><p className="text-xs">System Health</p><p className={`font-body text-xs font-bold ${statusTone}`}>{systemHealth}</p></div>
                </div>
                <div className="flex items-center gap-3 border-b border-[#17233B] px-3 py-3 sm:border-b-0 sm:border-r xl:px-5">
                  <Boxes className="h-6 w-6 text-[#22E66B]" />
                  <div><p className="text-xs">Device</p><p className="font-body text-xs font-bold text-[#22E66B]">{connectedMicCount || "X32"} Connected</p></div>
                </div>
                <div className="flex items-center gap-3 px-3 py-3 xl:px-5">
                  <Gauge className="h-6 w-6 text-[#22E66B]" />
                  <div><p className="text-xs">AI Mix Engine</p><p className="font-body text-xs font-bold text-[#22E66B]">{config.aiGainGuardEnabled ? "Active" : "Standby"}</p></div>
                </div>
              </div>
              <button data-testid="sound-hub-settings-button" type="button" onClick={() => setStatusMessage("Sound Hub settings panel is synchronized.")} className="grid h-14 w-14 place-items-center rounded-[8px] border border-[#253657] bg-[#071022]">
                <Settings className="h-6 w-6" />
              </button>
              <Link data-testid="sound-hub-go-live-link" href="/owner/control" className="flex h-12 items-center gap-3 rounded-[8px] bg-gradient-to-r from-[#D80074] via-[#7B3DFF] to-[#007DFF] px-5 font-ui text-sm font-bold uppercase shadow-[0_0_24px_rgba(255,47,207,0.35)] xl:h-14 xl:px-8 xl:text-base">
                <Radio className="h-5 w-5" /> Go Live
              </Link>
            </div>
          </header>

          <div className="grid gap-3 p-3 xl:grid-cols-2 2xl:grid-cols-[0.86fr_1.43fr_0.7fr] 2xl:p-4">
            <Panel title="AI Mix Engine">
              <div className="mt-4 grid gap-4 lg:grid-cols-[8.5rem_1fr] 2xl:grid-cols-[10rem_1fr]">
                <div className="grid h-28 w-28 place-items-center rounded-full border-[6px] border-[#8A2EFF] bg-[#090D1E] shadow-[0_0_28px_rgba(138,46,255,0.75)] 2xl:h-36 2xl:w-36">
                  <div className="text-center"><p className="font-headline text-4xl text-[#C566FF] 2xl:text-5xl">AI</p><p className="font-body text-xs text-[#22E66B]">Active</p></div>
                </div>
                <div>
                  <p className="font-body text-sm text-white">Auto Leveling is keeping your mix balanced.</p>
                  <div className="mt-6 h-8 rounded bg-[linear-gradient(90deg,transparent,#C566FF,transparent)] opacity-80" />
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    {[
                      ["Feedback Shield", "feedbackFinder"],
                      ["Peak Guard", "headroomManager"],
                    ].map(([label, key]) => (
                      <button key={key} data-testid={`sound-hub-ai-${key}`} type="button" disabled={configPending} onClick={() => persistLocalState((current) => ({ ...current, toolStates: { ...current.toolStates, [key]: !current.toolStates[key] } }), `${label} state saved.`)} className="rounded-[6px] border border-[#17233B] bg-[#091225] p-3 text-left disabled:opacity-45">
                        <span className="block font-body text-xs">{label}</span>
                        <span className="font-ui text-xs text-[#22E66B]">{localState.toolStates[key] ? "On" : "Off"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ["Loudness Control", "aiGainGuardEnabled", config.aiGainGuardEnabled],
                  ["Dynamic EQ", "concertEqPreset", config.concertEqPreset === "full_choir"],
                  ["Noise Reduction", "whiteNoiseSuppressor", config.whiteNoiseSuppressor > 0],
                  ["Monitor Mix", "monitorMix", true],
                  ["Headroom Protection", "masterLimiterCompressor", config.masterLimiterCompressor > 0],
                  ["Peak Guard", "peakGuard", localState.toolStates.headroomManager],
                ].map(([label, key, enabled]) => (
                  <button
                    key={String(key)}
                    data-testid={`sound-hub-feature-${String(key)}`}
                    type="button"
                    disabled={configPending}
                    onClick={() => {
                      if (key === "aiGainGuardEnabled") onConfigChange({ aiGainGuardEnabled: !config.aiGainGuardEnabled });
                      else if (key === "whiteNoiseSuppressor") onConfigChange({ whiteNoiseSuppressor: config.whiteNoiseSuppressor > 0 ? 0 : 35 });
                      else if (key === "masterLimiterCompressor") onConfigChange({ masterLimiterCompressor: config.masterLimiterCompressor > 0 ? 0 : 72 });
                      else persistLocalState((current) => ({ ...current, toolStates: { ...current.toolStates, [String(key)]: !current.toolStates[String(key)] } }), `${label} saved.`);
                    }}
                    className="rounded-[6px] border border-[#17233B] bg-[#091225] p-3 text-left disabled:opacity-45"
                  >
                    <span className="block font-body text-xs">{label as string}</span>
                    <span className="font-ui text-xs text-[#22E66B]">{enabled ? "On" : "Off"}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="font-ui text-xs uppercase text-white/55">Current Event Sound Profile</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <select data-testid="sound-hub-profile-select" disabled={configPending} value={config.concertEqPreset} onChange={(event) => handlePresetChange(event.target.value as ConcertEqPreset)} className="min-h-11 rounded-[7px] border border-[#253657] bg-[#091225] px-3 font-body text-sm outline-none disabled:opacity-45">
                    {eqPresets.map((preset) => <option key={preset} value={preset}>{CONCERT_EQ_PRESET_LABELS[preset]}</option>)}
                  </select>
                  <button data-testid="sound-hub-apply-smart-mix-button" type="button" disabled={configPending} onClick={handleSmartMix} className="min-h-11 rounded-[7px] bg-gradient-to-r from-[#D80074] to-[#007DFF] px-5 font-ui text-xs uppercase disabled:opacity-45">
                    Apply Smart Mix
                  </button>
                </div>
                <p className="mt-3 font-body text-xs text-white/65">Detected setup: {microphones.slice(0, 5).map((mic) => mic.displayName.split("(")[0].trim()).join(", ") || "Lead Vocal, Choir, Keys, Bass, Drums"}</p>
              </div>
            </Panel>

            <Panel title="Live Input Channels" className="xl:col-span-2 2xl:col-span-1 2xl:row-span-1">
              <div className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-5 xl:grid-cols-9">
                {channelTelemetry.map((channel) => (
                  <div key={channel.id} className={`rounded-[7px] border bg-[#050A14] p-2 text-center ${channel.id === "main-mix" ? "border-[#C566FF]" : "border-[#17233B]"}`}>
                    <ChannelIcon type={channel.icon} />
                    <p className="mt-2 min-h-8 font-body text-xs font-bold">{channel.label}</p>
                    <span className="mt-1 inline-block rounded bg-[#111A2B] px-2 py-1 font-ui text-[0.58rem] text-white/70">AI</span>
                    <div className="mt-3 flex h-36 items-end justify-center gap-2 2xl:h-44">
                      <div className="relative h-full w-3 overflow-hidden rounded bg-[#101827]">
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#00E66B] via-[#F4EA00] to-[#FF304C]" style={{ height: `${channel.levelPct}%` }} />
                        <span className="absolute inset-x-0 h-px bg-white" style={{ bottom: `${channel.peakPct}%` }} />
                      </div>
                      <input data-testid={`sound-hub-channel-${channel.id}-fader`} type="range" min={0} max={100} value={channel.level} onChange={(event) => handleChannelLevel(channel.id, Number(event.target.value))} className="h-36 w-6 [writing-mode:vertical-lr] [direction:rtl] accent-[#D9E3F0] 2xl:h-44" />
                    </div>
                    <p className="mt-2 font-body text-xs tabular-nums text-white/75">{channel.db} dB</p>
                    <div className="mt-2 flex justify-center gap-1">
                      <button data-testid={`sound-hub-channel-${channel.id}-solo`} type="button" aria-pressed={channel.solo} onClick={() => toggleChannelFlag(channel.id, "solo")} className={`rounded border px-2 py-1 font-ui text-xs ${channel.solo ? "border-[#C566FF] bg-[#2A123B] text-[#E387FF]" : "border-[#253657] bg-[#071022]"}`}>S</button>
                      <button data-testid={`sound-hub-channel-${channel.id}-mute`} type="button" aria-pressed={channel.mute} onClick={() => toggleChannelFlag(channel.id, "mute")} className={`rounded border px-2 py-1 font-ui text-xs ${channel.mute ? "border-red-400 bg-red-500/20 text-red-200" : "border-[#253657] bg-[#071022]"}`}>M</button>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="grid gap-3">
              <Panel title="Broadcast Output">
                <p className="mt-5 font-body text-xs text-white/80">Streaming Loudness</p>
                <p className="font-headline text-3xl">{loudness} LUFS</p>
                <p className="font-body text-xs text-white/55">Target: -16.0 LUFS</p>
                <div className="mt-5 h-2 rounded bg-gradient-to-r from-[#6B3B1D] via-[#E6FF00] to-[#1F2A44]">
                  <div className="ml-[52%] h-4 w-2 -translate-y-1 rounded bg-white" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <MiniSwitch checked={config.masterLimiterCompressor > 0} disabled={configPending} onClick={() => onConfigChange({ masterLimiterCompressor: config.masterLimiterCompressor > 0 ? 0 : 72 })} dataTestId="sound-hub-limiter-toggle" />
                  <MiniSwitch checked={localState.toolStates.headroomManager} onClick={() => persistLocalState((current) => ({ ...current, toolStates: { ...current.toolStates, headroomManager: !current.toolStates.headroomManager } }), "Peak guard saved.")} dataTestId="sound-hub-peak-guard-toggle" />
                </div>
                {["Main Mix (L/R)", "Record Mix", "Monitor Mix", "Backup Mix"].map((output, index) => (
                  <div key={output} className="mt-3 grid grid-cols-[6rem_1fr_3.5rem] items-center gap-2 font-body text-xs">
                    <span>{output}</span>
                    <span className="h-2 rounded bg-gradient-to-r from-[#22E66B] via-[#F4EA00] to-[#FF304C]" />
                    <span className="text-right">{[-1.8, -10.2, -6.1, -12.4][index]} dB</span>
                  </div>
                ))}
              </Panel>

              <Panel title="Live Audio Monitor">
                <div className="mt-4 aspect-video rounded-[7px] border border-[#17233B] bg-[radial-gradient(circle_at_center,rgba(123,61,255,0.45),transparent_35%),linear-gradient(135deg,#071022,#01040A)] p-4">
                  <div className="flex h-full items-center justify-center text-center">
                    <div><p className="font-ui text-xs uppercase text-white/60">Live Program Monitor</p><p className="mt-2 font-headline text-3xl">300 Awakening</p></div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                  <select data-testid="sound-hub-monitor-output-select" value={localState.monitorOutput} onChange={(event) => persistLocalState((current) => ({ ...current, monitorOutput: event.target.value }), "Monitor output saved.")} className="min-h-9 rounded border border-[#253657] bg-[#071022] px-2 font-body text-xs">
                    {["Main Mix L/R", "Record Mix", "Monitor Mix", "Backup Mix"].map((output) => <option key={output}>{output}</option>)}
                  </select>
                  <button data-testid="sound-hub-monitor-volume-button" type="button" onClick={() => setStatusMessage("Monitor output is active.")} className="grid h-9 w-9 place-items-center rounded border border-[#253657] bg-[#071022]"><Volume2 className="h-4 w-4" /></button>
                </div>
              </Panel>
            </div>

            <Panel title="Quick Scenes">
              <div className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-6">
                {scenes.map((scene) => (
                  <button key={scene} data-testid={`sound-hub-scene-${scene.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} type="button" onClick={() => persistLocalState((current) => ({ ...current, selectedScene: scene }), `${scene} scene saved.`)} className={`min-h-24 rounded-[7px] border px-3 font-body text-xs ${localState.selectedScene === scene ? "border-[#C566FF] bg-[#250E36] text-white" : "border-[#17233B] bg-[#071022] text-white/80"}`}>
                    <Waves className="mx-auto mb-2 h-7 w-7 text-[#C566FF]" />{scene}
                  </button>
                ))}
              </div>
              <button data-testid="sound-hub-save-scene-button" type="button" onClick={() => persistLocalState((current) => current, "Current scene saved.")} className="mx-auto mt-3 block font-body text-xs uppercase text-white/55">+ Save Scene</button>
            </Panel>

            <Panel title="Quick Adjust">
              <div className="mt-4 grid grid-cols-3 gap-4 md:grid-cols-5">
                {Object.entries(localState.quickAdjust).map(([key, value]) => (
                  <RotaryControl key={key} label={key.replace(/([A-Z])/g, " $1")} value={value} dataTestId={`sound-hub-quick-adjust-${key}`} onChange={(nextValue) => persistLocalState((current) => ({ ...current, quickAdjust: { ...current.quickAdjust, [key]: nextValue } }), "Quick adjust saved.")} />
                ))}
              </div>
            </Panel>

            <Panel title="Master Tools">
              <div className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-6">
                {[
                  ["Auto Gain", "aiGainGuardEnabled"],
                  ["Feedback Finder", "feedbackFinder"],
                  ["Noise Gate Assistant", "noiseGateAssistant"],
                  ["Smart EQ Match", "smartEqMatch"],
                  ["Headroom Manager", "headroomManager"],
                  ["Loudness Optimizer", "loudnessOptimizer"],
                ].map(([label, key]) => {
                  const checked = key === "aiGainGuardEnabled" ? config.aiGainGuardEnabled : localState.toolStates[key];
                  return (
                    <button key={key} data-testid={`sound-hub-master-tool-${key}`} type="button" disabled={configPending && key === "aiGainGuardEnabled"} onClick={() => key === "aiGainGuardEnabled" ? onConfigChange({ aiGainGuardEnabled: !config.aiGainGuardEnabled }) : persistLocalState((current) => ({ ...current, toolStates: { ...current.toolStates, [key]: !current.toolStates[key] } }), `${label} saved.`)} className={`min-h-28 rounded-[7px] border p-3 text-center disabled:opacity-45 ${checked ? "border-[#C566FF] bg-[#160B26]" : "border-[#17233B] bg-[#071022]"}`}>
                      <Sparkles className="mx-auto h-7 w-7 text-[#22E6A6]" />
                      <p className="mt-2 font-body text-xs">{label}</p>
                      <span className="mt-2 inline-block rounded bg-[#101827] px-2 py-1 font-ui text-[0.58rem]">AI</span>
                    </button>
                  );
                })}
              </div>
            </Panel>
          </div>

          <footer className="mx-4 mb-4 grid gap-3 rounded-[8px] border border-[#17233B] bg-[#071022]/90 p-4 font-body text-sm text-white/80 xl:grid-cols-[1fr_1fr_0.7fr_1.2fr]">
            <div><p className="font-ui text-xs uppercase text-[#E387FF]">Connected Devices</p><p className="mt-2 text-[#22E66B]">{connectedMicCount || 1} Sound Hub devices linked</p><p className="text-xs text-white/50">{inventoryError ?? mediaNodeDetail ?? "48 kHz sample rate. 0.7 ms latency."}</p></div>
            <div><p className="font-ui text-xs uppercase text-[#E387FF]">Automation</p><p className="mt-2">Current Scene: <span className="font-bold">{localState.selectedScene}</span></p><p className="text-xs text-white/55">Next Scene: Message</p></div>
            <div><p className="font-ui text-xs uppercase text-[#E387FF]">Countdown To Live</p><p className="mt-2 font-headline text-2xl">00:10:00</p></div>
            <div><p className="font-ui text-xs uppercase text-[#E387FF]">AI Status</p><p className="mt-2 text-[#22E66B]">{actionMessage ?? statusMessage}</p>{errorMessage ? <p className="text-red-300">{errorMessage}</p> : null}</div>
          </footer>
        </div>
      </div>
    </main>
  );
}
