import type { AudioChannel, BroadcastSource, StreamDestination } from "@/lib/broadcast/types";

export type AdapterSourceKind = "live" | "mock" | "unavailable";

export type VmixInput = {
  key: string;
  number: number;
  title: string;
  type: string;
  muted: boolean;
  volume: number;
  meterLevel: number;
  online: boolean;
};

export type VmixAdapterSnapshot = {
  ok: boolean;
  source: AdapterSourceKind;
  error: string | null;
  fetchedAt: string;
  version: string | null;
  inputs: VmixInput[];
  activeInputNumber: number | null;
  activeInputTitle: string | null;
  previewInputNumber: number | null;
  previewInputTitle: string | null;
  isRecording: boolean;
  isStreaming: boolean;
};

export type ObsScene = {
  name: string;
  isActive: boolean;
  isPreview: boolean;
};

export type ObsAdapterSnapshot = {
  ok: boolean;
  source: AdapterSourceKind;
  connected: boolean;
  error: string | null;
  fetchedAt: string;
  scenes: ObsScene[];
  currentScene: string | null;
  previewScene: string | null;
  streaming: boolean;
  recording: boolean;
};

export type StreamHealthDestination = StreamDestination & {
  droppedFrames: number;
};

export type StreamHealthSnapshot = {
  ok: boolean;
  source: AdapterSourceKind;
  error: string | null;
  fetchedAt: string;
  bitrateKbps: number;
  droppedFrames: number;
  packetLossPercent: number;
  bitrateStable: boolean;
  internetStatus: "online" | "degraded" | "offline";
  destinations: StreamHealthDestination[];
};

export type AudioChannelTelemetry = {
  id: string;
  name: string;
  peakLevel: number;
  meterLevel: number;
  volume: number;
  muted: boolean;
  clipping: boolean;
  autoGain: boolean;
  silent: boolean;
};

export type AudioHealthSnapshot = {
  ok: boolean;
  source: AdapterSourceKind;
  error: string | null;
  fetchedAt: string;
  masterPeak: number;
  clipping: boolean;
  silent: boolean;
  channels: AudioChannelTelemetry[];
};

export type AdapterBundle = {
  devMode: boolean;
  vmix: VmixAdapterSnapshot;
  obs: ObsAdapterSnapshot;
  streamHealth: StreamHealthSnapshot;
  audioHealth: AudioHealthSnapshot;
};

export type VmixCommandAction =
  | "refresh"
  | "set_preview"
  | "cut"
  | "take"
  | "fade"
  | "stinger"
  | "start_streaming"
  | "stop_streaming"
  | "start_recording"
  | "stop_recording";

export type VmixCommandRequest = {
  action: VmixCommandAction;
  inputNumber?: number;
};

export type MappedSources = {
  sources: BroadcastSource[];
  previewSourceId: string | null;
  programSourceId: string | null;
};

export type MappedAudio = {
  channels: AudioChannel[];
};
