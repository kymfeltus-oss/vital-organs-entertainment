export type OpsAuthDecisionReason =
  | "ALLOWED_METADATA"
  | "ALLOWED_ALLOWLIST"
  | "ALLOWED_DEV_BYPASS"
  | "H1_NO_SESSION"
  | "H1_AUTH_ERROR"
  | "H2_ALLOWLIST_EMPTY"
  | "H3_EMAIL_NOT_ALLOWLISTED"
  | "H4_NO_EMAIL";

export type OpsAuthDiagnosticPayload = {
  hasSession: boolean;
  hasUser: boolean;
  normalizedEmail: string | null;
  allowlistCount: number;
  allowlistMatch: boolean;
  metadataOpsAdmin: boolean;
  devBypassActive: boolean;
  decisionReason: OpsAuthDecisionReason;
  willNotFound: boolean;
};

function isOpsAuthDebugEnabled(): boolean {
  return process.env.OPS_AUTH_DEBUG?.trim().toLowerCase() === "true";
}

export function logOpsAuthDiagnostic(payload: OpsAuthDiagnosticPayload): void {
  if (!isOpsAuthDebugEnabled()) return;

  console.info("[OPS_AUTH_DEBUG]", JSON.stringify(payload));
}

export function parseAdminAllowlistCount(): number {
  const raw = process.env.ADMIN_EMAILS?.trim() ?? "";
  if (!raw) return 0;
  return raw.split(",").map((entry) => entry.trim()).filter(Boolean).length;
}

export function evaluateOpsAuthDecision(input: {
  hasAuthError: boolean;
  hasUser: boolean;
  normalizedEmail: string | null;
  allowlistCount: number;
  allowlistMatch: boolean;
  metadataOpsAdmin: boolean;
  devBypassActive: boolean;
}): OpsAuthDiagnosticPayload {
  let decisionReason: OpsAuthDecisionReason;
  let willNotFound = false;

  if (input.hasAuthError) {
    decisionReason = "H1_AUTH_ERROR";
    willNotFound = true;
  } else if (!input.hasUser) {
    decisionReason = "H1_NO_SESSION";
    willNotFound = true;
  } else if (input.devBypassActive) {
    decisionReason = "ALLOWED_DEV_BYPASS";
  } else if (input.metadataOpsAdmin) {
    decisionReason = "ALLOWED_METADATA";
  } else if (!input.normalizedEmail) {
    decisionReason = "H4_NO_EMAIL";
    willNotFound = true;
  } else if (input.allowlistCount === 0) {
    decisionReason = "H2_ALLOWLIST_EMPTY";
    willNotFound = true;
  } else if (!input.allowlistMatch) {
    decisionReason = "H3_EMAIL_NOT_ALLOWLISTED";
    willNotFound = true;
  } else {
    decisionReason = "ALLOWED_ALLOWLIST";
  }

  return {
    hasSession: input.hasUser && !input.hasAuthError,
    hasUser: input.hasUser,
    normalizedEmail: input.normalizedEmail,
    allowlistCount: input.allowlistCount,
    allowlistMatch: input.allowlistMatch,
    metadataOpsAdmin: input.metadataOpsAdmin,
    devBypassActive: input.devBypassActive,
    decisionReason,
    willNotFound,
  };
}
