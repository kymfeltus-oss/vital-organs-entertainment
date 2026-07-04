/** Owner audio workspace contracts — presentational UI only; processing lives on media services. */

export type ConcertEqPreset = "spoken_word" | "full_choir" | "acoustic_prayer";

export type OwnerAudioBusKey =
  | "lr_master"
  | "stream_mix"
  | "monitor_mix"
  | "choir_bus"
  | "pastor_mic";

export type OwnerAudioBusTelemetry = {
  key: OwnerAudioBusKey;
  label: string;
  levelDb: number;
  peakDb: number | null;
  muted: boolean;
  limiterActive: boolean;
  status: "healthy" | "warning" | "critical" | "offline";
  lastUpdateAt: string | null;
};

export const OWNER_SOUND_BUS_SPECS: ReadonlyArray<{
  key: OwnerAudioBusKey;
  label: string;
}> = [
  { key: "lr_master", label: "Master L/R" },
  { key: "stream_mix", label: "Stream Mix" },
  { key: "choir_bus", label: "Choir Bus" },
  { key: "pastor_mic", label: "Spoken Word" },
  { key: "monitor_mix", label: "Monitor Mix" },
];

export type AudioPresetStatus = {
  id: ConcertEqPreset;
  label: string;
  detail: string;
  configured: boolean;
  active: boolean;
};

export const AUDIO_PRESET_SPECS: ReadonlyArray<
  Pick<AudioPresetStatus, "id" | "label" | "detail">
> = [
  {
    id: "full_choir",
    label: "Full Choir",
    detail: "Choir, band, and room mix",
  },
  {
    id: "spoken_word",
    label: "Spoken Word",
    detail: "Pastor and speech-forward mix",
  },
  {
    id: "acoustic_prayer",
    label: "Acoustic Prayer",
    detail: "Acoustic and prayer mix",
  },
];

export type AudioLevelTrack = {
  id: string;
  label: string;
  /** Current level in dBFS (X32 floor ≈ -90 … clip headroom ≈ 0). */
  levelDb: number;
  /** Peak hold in dBFS (X32 floor ≈ -90 … clip headroom ≈ 0). */
  peakDb: number;
};

/** X32 silence floor — used for offline baselines and empty-bus fallbacks. */
export const AUDIO_SILENCE_FLOOR_DB = -90;

/** Stable cockpit track IDs — UI resolves meters by id, not array index. */
export const COCKPIT_AUDIO_TRACK_SPECS = [
  { id: "program-l", label: "Program L" },
  { id: "program-r", label: "Program R" },
  { id: "choir-bus", label: "Choir Bus" },
  { id: "spoken", label: "Spoken Word" },
  { id: "stream-master", label: "Stream Master" },
] as const;

export type CockpitAudioTrackId = (typeof COCKPIT_AUDIO_TRACK_SPECS)[number]["id"];

export function buildBaselineAudioTracks(floorDb = AUDIO_SILENCE_FLOOR_DB): AudioLevelTrack[] {
  return COCKPIT_AUDIO_TRACK_SPECS.map(({ id, label }) => ({
    id,
    label,
    levelDb: floorDb,
    peakDb: floorDb,
  }));
}

export type OwnerAudioTelemetry = {
  edgeReachable: boolean;
  tracks: AudioLevelTrack[];
  buses: OwnerAudioBusTelemetry[];
  capturedAt: string;
  mediaNodeStatus: "online" | "offline" | "degraded";
  mediaNodeDetail: string | null;
  healthScore: number | null;
  loudness: {
    measurementMode: "measured" | "estimated" | "unavailable";
    integratedLufs: number | null;
    shortTermLufs: number | null;
    momentaryLufs: number | null;
    truePeakDb: number | null;
    targetLufs: number | null;
    inTarget: boolean | null;
  };
  streamSafety: {
    limiterActive: boolean;
    muted: boolean;
  };
  consoleScene: {
    index: number | null;
    name: string | null;
  };
  console: {
    name: string | null;
    online: boolean;
    sampleRateHz: number | null;
    clockSource: string | null;
    firmwareVersion: string | null;
    lastHeartbeatAt: string | null;
    oscLatencyMs: number | null;
  };
};

export const CONCERT_EQ_PRESET_LABELS: Record<ConcertEqPreset, string> = {
  spoken_word: "Spoken Word",
  full_choir: "Full Choir",
  acoustic_prayer: "Acoustic Prayer",
};

/** Non-reactive silence baseline — never use simulated demo levels. */
export const DEFAULT_AUDIO_LEVEL_TRACKS: AudioLevelTrack[] = buildBaselineAudioTracks();
