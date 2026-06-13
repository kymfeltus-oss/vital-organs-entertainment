import type { OpsSnapshot } from "@/lib/ops/types";
import { HLS_PLAYBACK_REQUIREMENT } from "@/lib/live/hls";
import type { RestreamState } from "@/lib/live-hub/restream/types";
import { isRestreamHealthy } from "@/lib/live-hub/restream/types";
import type { VmixState } from "@/lib/live-hub/vmix/types";
import { isVmixReachable } from "@/lib/live-hub/vmix/types";
import type {
  ChecklistPhase,
  ChecklistPhaseId,
  ReadinessCheck,
  ReadinessCheckId,
} from "@/lib/live-hub/types";
import {
  evaluateConnectionPreference,
  type LiveHubNetworkSettings,
} from "@/lib/live-hub/network-settings";
import {
  formatInternetDetail,
  isNetworkOnline,
  type NetworkTelemetry,
} from "@/lib/live-hub/network";

export type ReadinessInputs = {
  vmix: VmixState | null;
  restream: RestreamState | null;
  opsSnapshot: OpsSnapshot;
  networkTelemetry: NetworkTelemetry;
  networkSettings: LiveHubNetworkSettings;
  uploadSpeedMbps: number | null;
  /** Changes on each client re-test; forces fresh lastUpdatedAt even when Mbps is unchanged. */
  uploadRecheckNonce?: number;
  /** Dev-only sticky simulate — detail suffix when Shift+click override is active. */
  uploadSpeedDevOverride?: boolean;
};

const CHECK_LABELS: Record<ReadinessCheckId, string> = {
  internet: "Internet Connection",
  upload_speed: "Upload Speed",
  stream_destination: "Stream Destination",
  encoder_vmix: "Encoder / vMix Connection",
  recording: "Recording Enabled",
  audio_input: "Audio Input",
  camera_feeds: "Camera Feeds",
  presentation: "Presentation System",
  backup_systems: "Backup Systems",
};

function nowIso(): string {
  return new Date().toISOString();
}

function resolveInternet(inputs: ReadinessInputs): ReadinessCheck {
  const telemetry = inputs.networkTelemetry;
  const settings = inputs.networkSettings;

  if (telemetry.lastProbedAt === null) {
    return {
      id: "internet",
      label: CHECK_LABELS.internet,
      status: "pending",
      detail: "Click to test — or open Network settings",
      lastUpdatedAt: null,
    };
  }

  const preferenceIssue = evaluateConnectionPreference(
    telemetry,
    settings.connectionPreference,
  );

  let status: ReadinessCheck["status"] = isNetworkOnline(telemetry, {
    requireServerProbe: settings.requireServerProbe,
  })
    ? preferenceIssue?.status === "warn"
      ? "warn"
      : "pass"
    : "fail";

  let detail = formatInternetDetail(telemetry);

  if (settings.broadcastWifiSsid.trim()) {
    detail = `${detail} · SSID: ${settings.broadcastWifiSsid.trim()}`;
  }

  if (preferenceIssue && status !== "fail") {
    detail = `${detail} · ${preferenceIssue.detail}`;
    if (preferenceIssue.status === "warn" && status === "pass") {
      status = "warn";
    }
  }

  return {
    id: "internet",
    label: CHECK_LABELS.internet,
    status,
    detail,
    lastUpdatedAt: telemetry.lastProbedAt,
  };
}

function resolveUploadSpeed(inputs: ReadinessInputs): ReadinessCheck {
  void inputs.uploadRecheckNonce;

  const overrideSuffix = inputs.uploadSpeedDevOverride ? " — dev override" : "";

  if (inputs.uploadSpeedMbps === null) {
    return {
      id: "upload_speed",
      label: CHECK_LABELS.upload_speed,
      status: "pending",
      detail: "Speed test not run",
      lastUpdatedAt: null,
    };
  }

  if (inputs.uploadSpeedMbps >= 10) {
    return {
      id: "upload_speed",
      label: CHECK_LABELS.upload_speed,
      status: "pass",
      detail: `${inputs.uploadSpeedMbps.toFixed(1)} Mbps upload${overrideSuffix}`,
      lastUpdatedAt: nowIso(),
    };
  }

  if (inputs.uploadSpeedMbps >= 5) {
    return {
      id: "upload_speed",
      label: CHECK_LABELS.upload_speed,
      status: "warn",
      detail: `${inputs.uploadSpeedMbps.toFixed(1)} Mbps upload — marginal for HD${overrideSuffix}`,
      lastUpdatedAt: nowIso(),
    };
  }

  return {
    id: "upload_speed",
    label: CHECK_LABELS.upload_speed,
    status: "fail",
    detail: `${inputs.uploadSpeedMbps.toFixed(1)} Mbps upload — insufficient${overrideSuffix}`,
    lastUpdatedAt: nowIso(),
  };
}

function resolveStreamDestination(inputs: ReadinessInputs): ReadinessCheck {
  const { stream } = inputs.opsSnapshot;
  const hasValidLane = stream.primaryConfigured || stream.backupConfigured;

  if (hasValidLane) {
    return {
      id: "stream_destination",
      label: CHECK_LABELS.stream_destination,
      status: "pass",
      detail: `Primary ${stream.primaryConfigured ? "armed" : "missing"} · Backup ${stream.backupConfigured ? "armed" : "missing"}`,
      lastUpdatedAt: stream.updatedAt,
    };
  }

  const hasInvalidLane =
    stream.primaryPlaybackUrlStatus === "invalid" ||
    stream.backupPlaybackUrlStatus === "invalid";

  if (hasInvalidLane) {
    return {
      id: "stream_destination",
      label: CHECK_LABELS.stream_destination,
      status: "fail",
      detail: `${HLS_PLAYBACK_REQUIREMENT} Configure a valid HLS playback URL before going live.`,
      lastUpdatedAt: stream.updatedAt,
    };
  }

  return {
    id: "stream_destination",
    label: CHECK_LABELS.stream_destination,
    status: "fail",
    detail: "No HLS playback URLs configured",
    lastUpdatedAt: stream.updatedAt,
  };
}

export const VMIX_OPERATOR_GUIDANCE =
  "Open vMix, enable Web Controller/API, verify port 8088 is listening, then refresh vMix state. vMix runs on the operator desktop — hosted server routes cannot reach local 127.0.0.1.";

function resolveEncoderVmix(inputs: ReadinessInputs): ReadinessCheck {
  const vmix = inputs.vmix;

  if (!vmix) {
    return {
      id: "encoder_vmix",
      label: CHECK_LABELS.encoder_vmix,
      status: "fail",
      detail: `vMix state unavailable. ${VMIX_OPERATOR_GUIDANCE}`,
      lastUpdatedAt: null,
    };
  }

  if (!isVmixReachable(vmix)) {
    const unreachableDetail =
      vmix.connectionStatus === "unreachable" || vmix.connectionStatus === "disconnected"
        ? `vMix ${vmix.connectionStatus}. ${VMIX_OPERATOR_GUIDANCE}`
        : `vMix ${vmix.connectionStatus}. ${VMIX_OPERATOR_GUIDANCE}`;

    return {
      id: "encoder_vmix",
      label: CHECK_LABELS.encoder_vmix,
      status: "fail",
      detail: unreachableDetail,
      lastUpdatedAt: vmix.lastUpdatedAt,
    };
  }

  return {
    id: "encoder_vmix",
    label: CHECK_LABELS.encoder_vmix,
    status: "pass",
    detail: `Connected · Active: ${vmix.activeInput ?? "—"}`,
    lastUpdatedAt: vmix.lastUpdatedAt,
  };
}

function resolveRecording(inputs: ReadinessInputs): ReadinessCheck {
  const vmix = inputs.vmix;

  if (!vmix || !isVmixReachable(vmix)) {
    return {
      id: "recording",
      label: CHECK_LABELS.recording,
      status: "unknown",
      detail: "vMix unreachable — recording state unknown",
      lastUpdatedAt: vmix?.lastUpdatedAt ?? null,
    };
  }

  return {
    id: "recording",
    label: CHECK_LABELS.recording,
    status: vmix.isRecording ? "pass" : "warn",
    detail: vmix.isRecording ? "Recording active" : "Recording not started",
    lastUpdatedAt: vmix.lastUpdatedAt,
  };
}

function resolveAudioInput(inputs: ReadinessInputs): ReadinessCheck {
  const vmix = inputs.vmix;

  if (!vmix || !isVmixReachable(vmix)) {
    return {
      id: "audio_input",
      label: CHECK_LABELS.audio_input,
      status: "fail",
      detail: "Cannot verify audio — vMix unreachable",
      lastUpdatedAt: vmix?.lastUpdatedAt ?? null,
    };
  }

  const level = vmix.audioMasterLevel;
  if (level <= 0) {
    return {
      id: "audio_input",
      label: CHECK_LABELS.audio_input,
      status: "fail",
      detail: "No audio master level detected",
      lastUpdatedAt: vmix.lastUpdatedAt,
    };
  }

  return {
    id: "audio_input",
    label: CHECK_LABELS.audio_input,
    status: "pass",
    detail: `Master level ${level}%`,
    lastUpdatedAt: vmix.lastUpdatedAt,
  };
}

function resolveCameraFeeds(inputs: ReadinessInputs): ReadinessCheck {
  const vmix = inputs.vmix;

  if (!vmix || !isVmixReachable(vmix)) {
    return {
      id: "camera_feeds",
      label: CHECK_LABELS.camera_feeds,
      status: "unknown",
      detail: "Camera feed status unknown",
      lastUpdatedAt: vmix?.lastUpdatedAt ?? null,
    };
  }

  const hasInputs = Boolean(vmix.activeInput && vmix.previewInput);

  return {
    id: "camera_feeds",
    label: CHECK_LABELS.camera_feeds,
    status: hasInputs ? "pass" : "warn",
    detail: hasInputs
      ? `Program ${vmix.activeInput} · Preview ${vmix.previewInput}`
      : "Missing program or preview input",
    lastUpdatedAt: vmix.lastUpdatedAt,
  };
}

function resolvePresentation(inputs: ReadinessInputs): ReadinessCheck {
  const vmix = inputs.vmix;
  const hasPreview = Boolean(vmix?.previewInput);

  return {
    id: "presentation",
    label: CHECK_LABELS.presentation,
    status: hasPreview ? "pass" : "pending",
    detail: hasPreview
      ? `Preview input: ${vmix?.previewInput}`
      : "Presentation layer not confirmed",
    lastUpdatedAt: vmix?.lastUpdatedAt ?? null,
  };
}

function resolveBackupSystems(inputs: ReadinessInputs): ReadinessCheck {
  const { stream } = inputs.opsSnapshot;
  const restreamOk = isRestreamHealthy(inputs.restream);

  if (!stream.backupConfigured && !restreamOk) {
    return {
      id: "backup_systems",
      label: CHECK_LABELS.backup_systems,
      status: "warn",
      detail: "No backup lane and Restream degraded",
      lastUpdatedAt: nowIso(),
    };
  }

  if (!stream.backupConfigured) {
    return {
      id: "backup_systems",
      label: CHECK_LABELS.backup_systems,
      status: "warn",
      detail: "Backup HLS lane not configured",
      lastUpdatedAt: stream.updatedAt,
    };
  }

  return {
    id: "backup_systems",
    label: CHECK_LABELS.backup_systems,
    status: "pass",
    detail: "Backup lane armed",
    lastUpdatedAt: stream.updatedAt,
  };
}

export function buildReadinessChecks(inputs: ReadinessInputs): ReadinessCheck[] {
  return [
    resolveInternet(inputs),
    resolveUploadSpeed(inputs),
    resolveStreamDestination(inputs),
    resolveEncoderVmix(inputs),
    resolveRecording(inputs),
    resolveAudioInput(inputs),
    resolveCameraFeeds(inputs),
    resolvePresentation(inputs),
    resolveBackupSystems(inputs),
  ];
}

export function countChecksByStatus(
  checks: ReadinessCheck[],
  status: ReadinessCheck["status"],
): number {
  return checks.filter((check) => check.status === status).length;
}

export function deriveChecklistPhases(
  checks: ReadinessCheck[],
  manualCompletion: Partial<Record<ChecklistPhaseId, boolean>>,
): ChecklistPhase[] {
  const systemIds: ReadinessCheckId[] = [
    "internet",
    "upload_speed",
    "stream_destination",
    "encoder_vmix",
    "recording",
    "audio_input",
    "camera_feeds",
    "presentation",
    "backup_systems",
  ];

  const systemChecks = checks.filter((check) => systemIds.includes(check.id));
  const systemComplete =
    manualCompletion.system ??
    (systemChecks.every((check) => check.status === "pass" || check.status === "warn") &&
      !systemChecks.some((check) => check.status === "fail"));

  const contentComplete = manualCompletion.content ?? false;
  const teamComplete = manualCompletion.team ?? false;

  const finalReviewComplete =
    manualCompletion.final_review ?? (systemComplete && contentComplete && teamComplete);

  const goLiveComplete = manualCompletion.go_live ?? false;

  return [
    { id: "system", label: "System Check", complete: systemComplete },
    { id: "content", label: "Content Check", complete: contentComplete },
    { id: "team", label: "Team Check", complete: teamComplete },
    { id: "final_review", label: "Final Review", complete: finalReviewComplete },
    { id: "go_live", label: "Go Live", complete: goLiveComplete },
  ];
}

export function estimateUploadSpeedMbps(): number | null {
  if (typeof navigator === "undefined" || !("connection" in navigator)) {
    return null;
  }

  const connection = (navigator as Navigator & { connection?: { downlink?: number } })
    .connection;

  if (!connection?.downlink) return null;
  return Math.max(1, connection.downlink * 0.4);
}

/** Re-read Network Information API downlink estimate (client-only). */
export function measureUploadSpeedMbps(): number | null {
  return estimateUploadSpeedMbps();
}
