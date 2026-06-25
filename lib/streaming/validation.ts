import type { StreamingValidationCheck, StreamingValidationResult } from "@/lib/streaming/types";

const DISPLAY_CHECKS = [
  { key: "oauth_token_present", label: "Account connected" },
  { key: "permissions", label: "Permissions verified" },
  { key: "live_capability", label: "Livestreaming enabled" },
  { key: "quota", label: "Quota available" },
  { key: "broadcast_prepared", label: "Broadcast prepared" },
  { key: "rtmp_ready", label: "RTMP ready" },
] as const;

export function mapAgentValidation(raw: {
  ok: boolean;
  status: string;
  checks: Array<{
    key: string;
    label: string;
    ok: boolean;
    message: string;
    severity?: string;
  }>;
  safe_user_message: string;
  technical_error?: string;
}): StreamingValidationResult {
  return {
    ok: raw.ok,
    status: raw.status as StreamingValidationResult["status"],
    checks: (raw.checks ?? []).map((check) => ({
      key: check.key,
      label: check.label,
      ok: check.ok,
      message: check.message,
      severity: (check.severity as StreamingValidationCheck["severity"]) ?? (check.ok ? "info" : "critical"),
    })),
    safeUserMessage: raw.safe_user_message,
    technicalError: raw.technical_error,
  };
}

export function validationToTestResult(validation: StreamingValidationResult): {
  success: boolean;
  connectionStatus: "ready" | "needs_attention" | "error";
  message: string;
  steps: StreamingValidationCheck[];
  validation: StreamingValidationResult;
} {
  return {
    success: validation.ok,
    connectionStatus: validation.ok ? "ready" : validation.status === "error" ? "error" : "needs_attention",
    message: validation.safeUserMessage,
    steps: validation.checks.map((check) => ({
      key: check.key,
      label: check.label,
      ok: check.ok,
      message: check.message,
      severity: check.severity,
    })),
    validation,
  };
}

export function displayValidationChecks(checks: StreamingValidationCheck[]): StreamingValidationCheck[] {
  const byKey = new Map(checks.map((check) => [check.key, check]));
  return DISPLAY_CHECKS.map((spec) => {
    const match = byKey.get(spec.key);
    if (match) return { ...match, label: spec.label };
    return {
      key: spec.key,
      label: spec.label,
      ok: false,
      message: "Not verified yet.",
      severity: "warning" as const,
    };
  });
}

export function deriveValidationStatuses(validation: StreamingValidationResult): {
  oauthStatus: string;
  permissionStatus: string;
  quotaStatus: string;
  livePermissionStatus: string;
  rtmpStatus: string;
  destinationStatus: string;
} {
  const byKey = new Map(validation.checks.map((check) => [check.key, check]));
  const statusFor = (key: string, fallback: string) => (byKey.get(key)?.ok ? "ready" : fallback);

  return {
    oauthStatus: statusFor("oauth_token_present", validation.ok ? "ready" : "error"),
    permissionStatus: statusFor("permissions", "unknown"),
    quotaStatus: statusFor("quota", "unknown"),
    livePermissionStatus: statusFor("live_capability", "unknown"),
    rtmpStatus: statusFor("rtmp_ready", "unknown"),
    destinationStatus: validation.ok ? "ready" : validation.status === "error" ? "error" : "needs_attention",
  };
}
