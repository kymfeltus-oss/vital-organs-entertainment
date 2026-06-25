export type MixerConnectionQuality = "Excellent" | "Good" | "Fair" | "Poor";

export type MixerTestStatus = "ready" | "wrong_device" | "unreachable" | "unavailable";

export type MixerEnvironmentMode = "development" | "production";

export type MixerTestSummary = {
  manufacturer: string;
  model: string;
  firmware: string | null;
  serialNumber: string | null;
  ipAddress: string;
  connectionQuality: MixerConnectionQuality;
  responseTimeMs: number;
  inputsDetected: number | null;
  mixesDetected: number | null;
  status: "Ready" | "Needs Attention";
};

export type MixerUnavailablePanel = {
  title: string;
  message: string;
  bullets?: string[];
};

export type MixerTestResult = {
  success: boolean;
  status: MixerTestStatus;
  message: string;
  environmentMode?: MixerEnvironmentMode;
  developmentPanel?: MixerUnavailablePanel;
  productionPanel?: MixerUnavailablePanel;
  summary?: MixerTestSummary;
  troubleshooting?: {
    title: string;
    bullets: string[];
  };
};

export type ScannedMixer = {
  name: string;
  model: string;
  manufacturer: string;
  ipAddress: string;
  firmware: string | null;
  connectionQuality: MixerConnectionQuality | null;
  responseTimeMs: number | null;
  mixerType: string;
};

export type MixerScanResult = {
  success: boolean;
  status: "found_one" | "found_many" | "none" | "unavailable";
  message: string;
  environmentMode?: MixerEnvironmentMode;
  mixers: ScannedMixer[];
};

export type MixerImportOptions = {
  channelNames: boolean;
  channelLabels: boolean;
  userLabels: boolean;
  routing: boolean;
  scenes: boolean;
  dcaGroups: boolean;
  muteGroups: boolean;
};

import type { Mixer } from "@/lib/todays-service/types";

export type MixerImportResult = {
  success: boolean;
  message: string;
  mixer?: Mixer;
  imported?: {
    channelCount: number;
    sceneCount: number;
    soundItemsCreated: number;
  };
};

export type MixerHealthCheckResult = {
  success: boolean;
  message: string;
  checks: { label: string; ok: boolean }[];
  warnings: string[];
};

export type MixerAudioDetectionResult = {
  success: boolean;
  message: string;
  inputs: { name: string; signalPresent: boolean }[];
  noSignalDetected: boolean;
};

export type LastConnectedMixer = {
  name: string;
  model: string;
  ipAddress: string;
  lastConnectedAt: string;
  mixerId: string;
};

export type MixerConnectionConfig = {
  port: number;
  timeoutMs: number;
  retryCount: number;
};

export const DEFAULT_MIXER_CONNECTION_CONFIG: MixerConnectionConfig = {
  port: 10023,
  timeoutMs: 2000,
  retryCount: 2,
};

export function mixerChoiceToType(choice: string): string {
  switch (choice) {
    case "Behringer X32":
      return "behringer_x32";
    case "Midas M32":
      return "midas_m32";
    case "Allen & Heath":
      return "allen_heath";
    case "Yamaha":
      return "yamaha";
    default:
      return "other";
  }
}

export function mixerTypeToMetadata(mixerType: string): {
  manufacturer: string | null;
  model: string | null;
} {
  switch (mixerType) {
    case "behringer_x32":
      return { manufacturer: "Behringer", model: "X32" };
    case "midas_m32":
      return { manufacturer: "Midas", model: "M32" };
    case "allen_heath":
      return { manufacturer: "Allen & Heath", model: null };
    case "yamaha":
      return { manufacturer: "Yamaha", model: null };
    default:
      return { manufacturer: null, model: null };
  }
}

export function formatLastConnectedDate(iso: string): { weekday: string; time: string } {
  try {
    const date = new Date(iso);
    return {
      weekday: date.toLocaleDateString(undefined, { weekday: "long" }),
      time: date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
    };
  } catch {
    return { weekday: iso, time: "" };
  }
}

/** @deprecated Use formatLastConnectedDate */
export function formatLastConnectedTime(iso: string): string {
  const { weekday, time } = formatLastConnectedDate(iso);
  return time ? `${weekday} ${time}` : weekday;
}
