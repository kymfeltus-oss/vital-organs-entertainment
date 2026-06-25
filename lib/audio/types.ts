export const AUDIO_ROLE_KEYS = [
  "pastor_wireless",
  "worship_leader",
  "choir_left",
  "choir_right",
  "lead_vocal",
  "bg_vocal_1",
  "bg_vocal_2",
  "bg_vocal_3",
  "acoustic_guitar",
  "electric_guitar",
  "bass",
  "keyboard_1",
  "keyboard_2",
  "hammond_organ",
  "kick",
  "snare",
  "toms",
  "overheads",
  "tracks",
  "playback",
  "audience_left",
  "audience_right",
] as const;

export type AudioRoleKey = (typeof AUDIO_ROLE_KEYS)[number];

export const AUDIO_BUS_KEYS = [
  "lr_master",
  "stream_mix",
  "monitor_mix",
  "choir_bus",
  "band_bus",
  "pastor_mic",
  "audience_mics",
  "recording_bus",
] as const;

export type AudioBusKey = (typeof AUDIO_BUS_KEYS)[number];

export const PRODUCTION_SCENES = [
  "pre_show",
  "countdown",
  "worship",
  "prayer",
  "choir",
  "special_music",
  "sermon",
  "invitation",
  "closing",
  "post_show",
] as const;

export type ProductionSceneKey = (typeof PRODUCTION_SCENES)[number];

export type AudioConnectionState = "online" | "offline" | "connecting" | "error";

export type AudioHealthStatus = "healthy" | "warning" | "critical" | "unknown" | "setup_required";

export type AudioSettings = {
  tenantId: string;
  x32Ip: string;
  x32OscPort: number;
  connectionTimeoutMs: number;
  meterRefreshRateMs: number;
  lufsTarget: number;
  truePeakCeiling: number;
  feedbackSensitivity: number;
  wirelessBatteryWarningPct: number;
  wirelessBatteryCriticalPct: number;
  streamSilenceThresholdDb: number;
  recordingSilenceThresholdDb: number;
  autoCreateIncidents: boolean;
  autoApplySceneSnapshots: boolean;
  enableAutomationRules: boolean;
  enableHealthCheckBeforeGoLive: boolean;
  enableTalkbackControls: boolean;
  enableAuditLogging: boolean;
  consoleDisplayName: string;
  updatedAt: string;
};

export type AudioChannelMapping = {
  id: string;
  tenantId: string;
  x32Channel: number;
  displayName: string;
  roleKey: string | null;
  wireless: boolean;
  wirelessChannel: string | null;
  backupAvailable: boolean;
  groupKey: string | null;
  thresholdDb: number | null;
};

export type LiveAudioChannel = {
  channel: number;
  name: string;
  roleKey: string | null;
  displayName: string;
  levelDb: number;
  meterLevel: number;
  muted: boolean;
  solo: boolean;
  clipping: boolean;
  status: AudioHealthStatus;
  wirelessRf: number | null;
  wirelessBatteryPct: number | null;
  lastUpdateAt: string;
  mappingConfigured: boolean;
};

export type LiveAudioBus = {
  busKey: string;
  displayName: string;
  levelDb: number;
  lufs: number | null;
  truePeakDb: number | null;
  muted: boolean;
  limiterActive: boolean;
  status: AudioHealthStatus;
  lastUpdateAt: string;
};

export type AudioOverviewCard = {
  id: string;
  label: string;
  levelDb: number;
  meterLevel: number;
  lufs: number | null;
  truePeakDb: number | null;
  status: AudioHealthStatus;
  connected: boolean;
  clipping: boolean;
  muted: boolean;
  solo: boolean;
  lastUpdateAt: string;
};

export type AudioAlert = {
  id: string;
  title: string;
  message: string;
  severity: "critical" | "warning" | "info";
  source: string;
  acknowledged: boolean;
  createdAt: string;
  incidentId: string | null;
};

export type WirelessDevice = {
  id: string;
  label: string;
  channel: number;
  batteryPct: number | null;
  rfStrength: number | null;
  rfQuality: AudioHealthStatus;
  status: AudioHealthStatus;
  backupAvailable: boolean;
};

export type LoudnessState = {
  integratedLufs: number | null;
  shortTermLufs: number | null;
  momentaryLufs: number | null;
  truePeakDb: number | null;
  lra: number | null;
  targetLufs: number;
  inTarget: boolean;
  updatedAt: string;
};

export type DelayState = {
  videoDelayMs: number | null;
  audioDelayMs: number | null;
  lipSyncOffsetMs: number | null;
  driftMs: number | null;
  autoCorrectionEnabled: boolean;
  syncConfidence: number;
  updatedAt: string;
};

export type FeedbackState = {
  detectedFrequencyHz: number | null;
  affectedChannel: number | null;
  riskLevel: "low" | "medium" | "high" | "critical";
  autoNotchEnabled: boolean;
  lastDetectedAt: string | null;
  rtaBins: number[];
};

export type WaveformLane = {
  id: string;
  label: string;
  samples: number[];
  available: boolean;
};

export type AudioHealthCheckItem = {
  id: string;
  label: string;
  passed: boolean;
  severity: "critical" | "warning" | "info";
  detail: string;
};

export type AudioHealthReport = {
  score: number;
  grade: string;
  items: AudioHealthCheckItem[];
  ranAt: string;
};

export type AudioStatus = {
  connection: AudioConnectionState;
  consoleName: string;
  x32Ip: string;
  streamStatus: string;
  streamLiveMs: number | null;
  viewers: number;
  bitrateMbps: number | null;
  droppedFrames: number;
  healthScore: number;
  lastHeartbeatAt: string | null;
  oscLatencyMs: number | null;
};

export type X32ConsoleState = {
  online: boolean;
  ip: string;
  firmwareVersion: string | null;
  currentScene: string | null;
  currentSceneIndex: number | null;
  sampleRate: number | null;
  syncSource: string | null;
  routingSummary: string;
  usbCardRouting: string | null;
  connectedDevices: string[];
  meterActive: boolean;
  lastHeartbeatAt: string | null;
  oscLatencyMs: number | null;
};

export type AudioScene = {
  index: number;
  name: string;
  productionScene: string | null;
  mapped: boolean;
};

export type AudioSnapshot = {
  id: string;
  name: string;
  mappedScene: string | null;
  description: string;
  lastUsedAt: string | null;
  status: string;
  isPreshowDefault: boolean;
  isGoLiveDefault: boolean;
};

export type AudioEffectSlot = {
  slot: number;
  name: string;
  assignedTo: string;
  active: boolean;
  returnLevelDb: number;
  status: AudioHealthStatus;
};

export type AudioLiveMessage =
  | { type: "status"; payload: AudioStatus }
  | { type: "channels"; payload: LiveAudioChannel[] }
  | { type: "buses"; payload: LiveAudioBus[] }
  | { type: "overview"; payload: AudioOverviewCard[] }
  | { type: "alerts"; payload: AudioAlert[] }
  | { type: "wireless"; payload: WirelessDevice[] }
  | { type: "loudness"; payload: LoudnessState }
  | { type: "delay"; payload: DelayState }
  | { type: "feedback"; payload: FeedbackState }
  | { type: "waveforms"; payload: WaveformLane[] }
  | { type: "health"; payload: AudioHealthReport };

export type AudioPermissions = {
  role: "owner" | "admin" | "producer" | "viewer";
  canView: boolean;
  canControlBasic: boolean;
  canControlX32: boolean;
  canManageSettings: boolean;
  canManageSnapshots: boolean;
};

export const DEFAULT_AUDIO_SETTINGS: Omit<AudioSettings, "tenantId" | "updatedAt"> = {
  x32Ip: "",
  x32OscPort: 10023,
  connectionTimeoutMs: 5000,
  meterRefreshRateMs: 100,
  lufsTarget: -14,
  truePeakCeiling: -1,
  feedbackSensitivity: 0.65,
  wirelessBatteryWarningPct: 25,
  wirelessBatteryCriticalPct: 10,
  streamSilenceThresholdDb: -50,
  recordingSilenceThresholdDb: -50,
  autoCreateIncidents: true,
  autoApplySceneSnapshots: false,
  enableAutomationRules: true,
  enableHealthCheckBeforeGoLive: true,
  enableTalkbackControls: true,
  enableAuditLogging: true,
  consoleDisplayName: "X32 — Church Main Console",
};
