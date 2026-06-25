import type { StreamingPlatform } from "@/lib/streaming/types";
import type { StreamingQuality } from "@/lib/internet/types";

export const STREAMING_WIZARD_STEPS = [
  "choose",
  "authenticate",
  "stream-info",
  "video",
  "audio",
  "network",
  "destination-test",
  "preview",
  "save",
] as const;

export type StreamingWizardStep = (typeof STREAMING_WIZARD_STEPS)[number];

export type StreamingResolution = "720p" | "1080p" | "1440p" | "4k";
export type StreamingFps = 30 | 60;
export type StreamingCodec = "h264" | "h265" | "av1";
export type EncoderType = "nvenc" | "quicksync" | "amf" | "x264";
export type AudioSampleRate = 44100 | 48000 | 96000;
export type AudioChannels = "stereo" | "mono";
export type AudioBitrateKbps = 128 | 192 | 256 | 320;
export type LatencyMode = "normal" | "low" | "ultra-low";

export type StreamingVideoProfile = {
  resolution: StreamingResolution;
  fps: StreamingFps;
  codec: StreamingCodec;
  bitrateKbps: number;
  keyframeIntervalSec: number;
  adaptiveBitrate: boolean;
  hdr: boolean;
};

export type StreamingAudioProfile = {
  source: string;
  sourceType: "mixer" | "microphone" | "system";
  sampleRate: AudioSampleRate;
  channels: AudioChannels;
  bitrateKbps: AudioBitrateKbps;
};

export type StreamingEncoderProfile = {
  encoder: EncoderType;
  detectedEncoders: EncoderType[];
  gpuName: string | null;
};

export type StreamingNetworkTest = {
  success: boolean;
  uploadMbps: number;
  downloadMbps: number;
  latencyMs: number;
  packetLossPercent: number;
  jitterMs: number;
  recommendedBitrateKbps: number;
  streamingQuality: StreamingQuality;
  testedAt: string;
  message: string;
};

export type StreamingPlatformSpec = {
  maxResolution: string;
  maxBitrateKbps: number;
  latencyMode: LatencyMode;
  latencyLabel: string;
  supportsHdr: boolean;
  supportsOAuth: boolean;
  logoKey: string;
};

export const STREAMING_PLATFORM_SPECS: Record<StreamingPlatform, StreamingPlatformSpec> = {
  youtube: {
    maxResolution: "4K60 HDR",
    maxBitrateKbps: 51000,
    latencyMode: "normal",
    latencyLabel: "Normal latency",
    supportsHdr: true,
    supportsOAuth: true,
    logoKey: "youtube",
  },
  facebook: {
    maxResolution: "1080p60",
    maxBitrateKbps: 9000,
    latencyMode: "low",
    latencyLabel: "Low latency",
    supportsHdr: false,
    supportsOAuth: true,
    logoKey: "facebook",
  },
  church_website: {
    maxResolution: "1080p60",
    maxBitrateKbps: 8000,
    latencyMode: "normal",
    latencyLabel: "Embed latency",
    supportsHdr: false,
    supportsOAuth: false,
    logoKey: "church",
  },
  vimeo: {
    maxResolution: "4K60",
    maxBitrateKbps: 30000,
    latencyMode: "normal",
    latencyLabel: "Normal latency",
    supportsHdr: true,
    supportsOAuth: true,
    logoKey: "vimeo",
  },
  twitch: {
    maxResolution: "1080p60",
    maxBitrateKbps: 8000,
    latencyMode: "low",
    latencyLabel: "Low latency",
    supportsHdr: false,
    supportsOAuth: true,
    logoKey: "twitch",
  },
  custom_rtmp: {
    maxResolution: "4K60",
    maxBitrateKbps: 50000,
    latencyMode: "normal",
    latencyLabel: "Server dependent",
    supportsHdr: true,
    supportsOAuth: false,
    logoKey: "rtmp",
  },
};

export const DEFAULT_VIDEO_PROFILE: StreamingVideoProfile = {
  resolution: "1080p",
  fps: 60,
  codec: "h264",
  bitrateKbps: 6500,
  keyframeIntervalSec: 2,
  adaptiveBitrate: true,
  hdr: false,
};

export const DEFAULT_AUDIO_PROFILE: StreamingAudioProfile = {
  source: "",
  sourceType: "mixer",
  sampleRate: 48000,
  channels: "stereo",
  bitrateKbps: 192,
};

export function recommendedBitrateKbps(uploadMbps: number, resolution: StreamingResolution, fps: StreamingFps): number {
  const base = resolution === "4k" ? 15000 : resolution === "1440p" ? 9000 : resolution === "1080p" ? 6000 : 3500;
  const fpsBoost = fps === 60 ? 1.15 : 1;
  const uploadCap = Math.floor(uploadMbps * 1000 * 0.7);
  return Math.max(1500, Math.min(Math.round(base * fpsBoost), uploadCap > 0 ? uploadCap : Math.round(base * fpsBoost)));
}

export function parseVideoProfile(raw: Record<string, unknown> | undefined): StreamingVideoProfile {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_VIDEO_PROFILE };
  return {
    resolution: (raw.resolution as StreamingResolution) ?? DEFAULT_VIDEO_PROFILE.resolution,
    fps: (raw.fps as StreamingFps) ?? DEFAULT_VIDEO_PROFILE.fps,
    codec: (raw.codec as StreamingCodec) ?? DEFAULT_VIDEO_PROFILE.codec,
    bitrateKbps: typeof raw.bitrateKbps === "number" ? raw.bitrateKbps : DEFAULT_VIDEO_PROFILE.bitrateKbps,
    keyframeIntervalSec:
      typeof raw.keyframeIntervalSec === "number" ? raw.keyframeIntervalSec : DEFAULT_VIDEO_PROFILE.keyframeIntervalSec,
    adaptiveBitrate: raw.adaptiveBitrate !== false,
    hdr: Boolean(raw.hdr),
  };
}

export function parseAudioProfile(raw: Record<string, unknown> | undefined): StreamingAudioProfile {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_AUDIO_PROFILE };
  return {
    source: typeof raw.source === "string" ? raw.source : "",
    sourceType: (raw.sourceType as StreamingAudioProfile["sourceType"]) ?? "mixer",
    sampleRate: (raw.sampleRate as AudioSampleRate) ?? DEFAULT_AUDIO_PROFILE.sampleRate,
    channels: (raw.channels as AudioChannels) ?? DEFAULT_AUDIO_PROFILE.channels,
    bitrateKbps: (raw.bitrateKbps as AudioBitrateKbps) ?? DEFAULT_AUDIO_PROFILE.bitrateKbps,
  };
}

export function parseNetworkTest(raw: Record<string, unknown> | undefined): StreamingNetworkTest | null {
  if (!raw || typeof raw !== "object" || !raw.testedAt) return null;
  return {
    success: Boolean(raw.success),
    uploadMbps: Number(raw.uploadMbps) || 0,
    downloadMbps: Number(raw.downloadMbps) || 0,
    latencyMs: Number(raw.latencyMs) || 0,
    packetLossPercent: Number(raw.packetLossPercent) || 0,
    jitterMs: Number(raw.jitterMs) || 0,
    recommendedBitrateKbps: Number(raw.recommendedBitrateKbps) || 0,
    streamingQuality: (raw.streamingQuality as StreamingQuality) ?? "unknown",
    testedAt: String(raw.testedAt),
    message: typeof raw.message === "string" ? raw.message : "",
  };
}

export function formatVideoProfileLabel(profile: StreamingVideoProfile): string {
  return `${profile.resolution}${profile.fps}`;
}

export function connectionQualityLabel(quality: string | null | undefined): string {
  switch (quality) {
    case "excellent":
      return "Excellent Connection";
    case "good":
      return "Good Connection";
    case "fair":
      return "Fair Connection";
    case "poor":
      return "Poor Connection";
    default:
      return "Connection Unknown";
  }
}

export function wizardStepLabel(step: StreamingWizardStep): string {
  switch (step) {
    case "choose":
      return "Broadcast Destinations";
    case "authenticate":
      return "Authenticate";
    case "stream-info":
      return "Stream Information";
    case "video":
      return "Video Settings";
    case "audio":
      return "Audio Settings";
    case "network":
      return "Connection Test";
    case "destination-test":
      return "Destination Test";
    case "preview":
      return "Preview";
    case "save":
      return "Save";
    default:
      return step;
  }
}

export function wizardStepIndex(step: StreamingWizardStep): number {
  return STREAMING_WIZARD_STEPS.indexOf(step);
}
