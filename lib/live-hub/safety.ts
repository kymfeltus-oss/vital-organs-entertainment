import type { OpsSnapshot } from "@/lib/ops/types";
import type { RestreamState } from "@/lib/live-hub/restream/types";
import { isRestreamHealthy } from "@/lib/live-hub/restream/types";
import type { VmixState } from "@/lib/live-hub/vmix/types";
import { isVmixReachable } from "@/lib/live-hub/vmix/types";
import type { LiveHubSettings, ReadinessCheck, SafetyIssue } from "@/lib/live-hub/types";
import { buildReadinessChecks, type ReadinessInputs } from "@/lib/live-hub/readiness";

export type GoLiveEvaluationInput = {
  vmix: VmixState | null;
  restream: RestreamState | null;
  opsSnapshot: OpsSnapshot;
  checks: ReadinessCheck[];
  settings: LiveHubSettings;
  networkOnline: boolean;
  operatorApproved: boolean;
  /** Stripe API connectivity — null means the health check has not responded yet. */
  stripeApiLive: boolean | null;
  /** Manual operator checklist toggles (content / team phases). */
  contentReady: boolean;
  teamAligned: boolean;
  /** Normalized local operator mic level from Web Audio analyser (0–1). */
  localMicLevel: number;
};

/** Minimum normalized mic level treated as an active local audio feed. */
export const LOCAL_MIC_ACTIVE_THRESHOLD = 0.01;

/** Prefer vMix master telemetry; fall back to local mic when vMix is silent. */
export function resolveCombinedAudioLevel(
  vmixMasterLevel: number | null | undefined,
  localMicLevel: number,
): number {
  const vmixLevel = vmixMasterLevel ?? 0;
  if (vmixLevel > 0) return vmixLevel;
  return localMicLevel;
}

export function isLocalMicAudioActive(localMicLevel: number): boolean {
  return localMicLevel > LOCAL_MIC_ACTIVE_THRESHOLD;
}

export function isVmixAudioActive(vmix: VmixState | null): boolean {
  return (vmix?.audioMasterLevel ?? 0) > 0;
}

export type GoLiveDecision = {
  blocked: boolean;
  criticalIssues: SafetyIssue[];
  warnings: SafetyIssue[];
  canProceedWithApproval: boolean;
};

function criticalIssue(id: string, label: string, detail: string): SafetyIssue {
  return { id, severity: "critical", label, detail };
}

function warningIssue(id: string, label: string, detail: string): SafetyIssue {
  return { id, severity: "warning", label, detail };
}

export function evaluateGoLiveDecision(input: GoLiveEvaluationInput): GoLiveDecision {
  const criticalIssues: SafetyIssue[] = [];
  const warnings: SafetyIssue[] = [];

  if (!input.networkOnline) {
    criticalIssues.push(
      criticalIssue("network_offline", "Network Offline", "Internet connection is required."),
    );
  }

  const internetCheck = input.checks.find((check) => check.id === "internet");
  if (internetCheck?.status === "warn" && input.networkOnline) {
    warnings.push(
      warningIssue("network_degraded", "Network Preference", internetCheck.detail),
    );
  }

  if (!isVmixReachable(input.vmix)) {
    criticalIssues.push(
      criticalIssue(
        "vmix_unreachable",
        "vMix Unreachable",
        input.vmix?.connectionStatus === "stale"
          ? "vMix telemetry is stale."
          : "vMix encoder is not connected.",
      ),
    );
  }

  if (input.vmix?.isStale) {
    criticalIssues.push(
      criticalIssue("vmix_stale", "Stale vMix Telemetry", "Refresh vMix state before going live."),
    );
  }

  if (input.restream?.isStale) {
    criticalIssues.push(
      criticalIssue(
        "restream_stale",
        "Stale Restream Telemetry",
        "Refresh Restream status before going live.",
      ),
    );
  }

  const destinationCheck = input.checks.find((check) => check.id === "stream_destination");
  if (destinationCheck?.status === "fail") {
    criticalIssues.push(
      criticalIssue(
        "no_destination",
        "No Stream Destination",
        destinationCheck.detail,
      ),
    );
  }

  const audioCheck = input.checks.find((check) => check.id === "audio_input");
  const vmixAudioActive = isVmixAudioActive(input.vmix);
  const localMicActive = isLocalMicAudioActive(input.localMicLevel);

  if (audioCheck?.status === "fail" && !vmixAudioActive && !localMicActive) {
    criticalIssues.push(
      criticalIssue("no_audio", "Audio Missing", audioCheck.detail),
    );
  } else if (audioCheck?.status === "fail" && !vmixAudioActive && localMicActive) {
    warnings.push(
      warningIssue(
        "audio_local_fallback",
        "Audio via Operator Mic",
        `vMix master silent; local mic registers ${(input.localMicLevel * 100).toFixed(0)}% signal.`,
      ),
    );
  }

  const uploadCheck = input.checks.find((check) => check.id === "upload_speed");
  if (uploadCheck?.status === "fail") {
    criticalIssues.push(
      criticalIssue("upload_insufficient", "Upload Speed Insufficient", uploadCheck.detail),
    );
  } else if (uploadCheck?.status === "warn") {
    warnings.push(
      warningIssue("upload_degraded", "Upload Speed Degraded", uploadCheck.detail),
    );
  }

  const cameraCheck = input.checks.find((check) => check.id === "camera_feeds");
  if (cameraCheck && cameraCheck.status !== "pass") {
    criticalIssues.push(
      criticalIssue(
        "video_layers_missing",
        "Video Layers Missing",
        "Program and preview inputs must both be loaded before Go Live.",
      ),
    );
  }

  // Stripe gate with development sandbox bypass: NODE_ENV is inlined at build
  // time, so production builds always enforce the hard block.
  const isDevSandbox = process.env.NODE_ENV === "development";

  if (input.stripeApiLive !== true) {
    if (isDevSandbox) {
      warnings.push(
        warningIssue(
          "stripe_sandbox_bypass",
          "Stripe Sandbox Bypass",
          "Stripe is offline or unverified, but development sandbox mode is active (bypass enabled).",
        ),
      );
    } else if (input.stripeApiLive === false) {
      criticalIssues.push(
        criticalIssue(
          "stripe_disconnected",
          "Stripe Gateway Disconnected",
          "Financial collection cannot run — verify the Stripe API connection.",
        ),
      );
    } else {
      warnings.push(
        warningIssue(
          "stripe_unverified",
          "Stripe Unverified",
          "Stripe connectivity has not been confirmed yet.",
        ),
      );
    }
  }

  if (!input.contentReady) {
    criticalIssues.push(
      criticalIssue(
        "content_unchecked",
        "Content Not Confirmed",
        "Operator has not checked off Content Readiness.",
      ),
    );
  }

  if (!input.teamAligned) {
    criticalIssues.push(
      criticalIssue(
        "team_unchecked",
        "Team Not Aligned",
        "Operator has not checked off Team Alignment.",
      ),
    );
  }

  if (input.settings.blockGoLiveWithoutRecording && !input.vmix?.isRecording) {
    criticalIssues.push(
      criticalIssue(
        "recording_required",
        "Recording Disabled",
        "Recording must be active before Go Live.",
      ),
    );
  } else if (!input.vmix?.isRecording) {
    warnings.push(
      warningIssue("recording_off", "Recording Not Active", "Local recording is not running."),
    );
  }

  if (input.settings.blockGoLiveWithoutRestream && !isRestreamHealthy(input.restream)) {
    criticalIssues.push(
      criticalIssue(
        "restream_required",
        "Restream Disconnected",
        "Restream must be connected per hub settings.",
      ),
    );
  } else if (input.restream?.connectionStatus === "degraded") {
    warnings.push(
      warningIssue(
        "restream_degraded",
        "Restream Degraded",
        `Ingest or destination lane below threshold — ${input.restream.streamStatus}.`,
      ),
    );
  } else if (!isRestreamHealthy(input.restream)) {
    warnings.push(
      warningIssue(
        "restream_disconnected",
        "Restream Disconnected",
        input.restream?.connectionStatus ?? "Restream status unknown",
      ),
    );
  }

  const backupCheck = input.checks.find((check) => check.id === "backup_systems");
  if (backupCheck?.status === "warn") {
    warnings.push(
      warningIssue("backup_warn", "Backup Systems", backupCheck.detail),
    );
  }

  if (!input.opsSnapshot.stream.primaryConfigured) {
    const invalidPrimary =
      input.opsSnapshot.stream.primaryPlaybackUrlStatus === "invalid";
    criticalIssues.push(
      criticalIssue(
        "primary_missing",
        invalidPrimary ? "Primary Playback URL Invalid" : "Primary Lane Missing",
        invalidPrimary
          ? "Primary playback URL must be a valid HLS .m3u8 manifest."
          : "Configure primary HLS playback URL before Go Live.",
      ),
    );
  }

  if (input.opsSnapshot.stream.isLive) {
    warnings.push(
      warningIssue("already_live", "Already Live", "Platform stream flag is already live."),
    );
  }

  const blocked = criticalIssues.length > 0;
  const canProceedWithApproval = !blocked && input.operatorApproved;

  return {
    blocked,
    criticalIssues,
    warnings,
    canProceedWithApproval,
  };
}

export function buildSafetyIssuesFromInputs(inputs: ReadinessInputs): {
  critical: SafetyIssue[];
  warnings: SafetyIssue[];
} {
  const checks = buildReadinessChecks(inputs);
  const decision = evaluateGoLiveDecision({
    vmix: inputs.vmix,
    restream: inputs.restream,
    opsSnapshot: inputs.opsSnapshot,
    checks,
    settings: { blockGoLiveWithoutRecording: false, blockGoLiveWithoutRestream: false },
    networkOnline: inputs.networkOnline,
    operatorApproved: false,
    stripeApiLive: true,
    contentReady: true,
    teamAligned: true,
    localMicLevel: 0,
  });

  return {
    critical: decision.criticalIssues,
    warnings: decision.warnings,
  };
}

export function parseVmixAdapterResult(
  payload: unknown,
): { state: VmixState | null; error: string | null } {
  if (!payload || typeof payload !== "object") {
    return { state: null, error: "Invalid vMix response." };
  }

  const record = payload as { ok?: boolean; state?: VmixState; error?: string };

  if (record.ok === true && record.state) {
    return { state: record.state, error: null };
  }

  return {
    state: null,
    error: typeof record.error === "string" ? record.error : "vMix request failed.",
  };
}

export function parseRestreamAdapterResult(
  payload: unknown,
): { state: RestreamState | null; error: string | null } {
  if (!payload || typeof payload !== "object") {
    return { state: null, error: "Invalid Restream response." };
  }

  const record = payload as { ok?: boolean; state?: RestreamState; error?: string };

  if (record.ok === true && record.state) {
    return { state: record.state, error: null };
  }

  return {
    state: null,
    error: typeof record.error === "string" ? record.error : "Restream request failed.",
  };
}
