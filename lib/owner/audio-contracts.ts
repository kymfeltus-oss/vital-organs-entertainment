/** Owner audio workspace contracts — presentational UI only; processing lives on media services. */

export type ConcertEqPreset = "spoken_word" | "full_choir" | "acoustic_prayer";

export type OwnerAudioConfig = {
  aiGainGuardEnabled: boolean;
  whiteNoiseSuppressor: number;
  concertEqPreset: ConcertEqPreset;
  masterLimiterCompressor: number;
};

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
  tracks: AudioLevelTrack[];
  capturedAt: string;
  mediaNodeStatus: "online" | "offline" | "degraded";
  mediaNodeDetail: string | null;
};

export type OwnerAudioConfigPatch = Partial<OwnerAudioConfig>;

export type OwnerAudioWorkspaceState = {
  config: OwnerAudioConfig;
  telemetry: OwnerAudioTelemetry;
};

export const CONCERT_EQ_PRESET_LABELS: Record<ConcertEqPreset, string> = {
  spoken_word: "Spoken Word",
  full_choir: "Full Choir",
  acoustic_prayer: "Acoustic Prayer",
};

export const DEFAULT_OWNER_AUDIO_CONFIG: OwnerAudioConfig = {
  aiGainGuardEnabled: false,
  whiteNoiseSuppressor: 35,
  concertEqPreset: "full_choir",
  masterLimiterCompressor: 72,
};

/** Non-reactive silence baseline — never use simulated demo levels. */
export const DEFAULT_AUDIO_LEVEL_TRACKS: AudioLevelTrack[] = buildBaselineAudioTracks();
