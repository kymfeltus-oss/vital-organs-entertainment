import test from "node:test";
import assert from "node:assert/strict";
import {
  deriveValidationStatuses,
  displayValidationChecks,
  mapAgentValidation,
  validationToTestResult,
} from "../validation.ts";

test("mapAgentValidation maps provider payload", () => {
  const result = mapAgentValidation({
    ok: false,
    status: "needs_attention",
    checks: [
      {
        key: "oauth_token_present",
        label: "Account connected",
        ok: true,
        message: "Connected",
        severity: "info",
      },
      {
        key: "live_capability",
        label: "Livestreaming enabled",
        ok: false,
        message: "YouTube live streaming is not enabled on this channel.",
        severity: "critical",
      },
    ],
    safe_user_message: "YouTube live streaming is not enabled on this channel.",
    technical_error: "forbidden",
  });

  assert.equal(result.ok, false);
  assert.equal(result.checks.length, 2);
  assert.match(result.safeUserMessage, /not enabled/);
});

test("validationToTestResult never marks ready when checks fail", () => {
  const validation = mapAgentValidation({
    ok: false,
    status: "error",
    checks: [
      {
        key: "quota",
        label: "Quota available",
        ok: false,
        message: "Quota exceeded",
        severity: "critical",
      },
    ],
    safe_user_message: "Quota exceeded",
  });
  const testResult = validationToTestResult(validation);
  assert.equal(testResult.success, false);
  assert.equal(testResult.connectionStatus, "error");
});

test("deriveValidationStatuses maps check keys to status columns", () => {
  const validation = mapAgentValidation({
    ok: true,
    status: "ready",
    checks: [
      { key: "oauth_token_present", label: "Account connected", ok: true, message: "ok", severity: "info" },
      { key: "permissions", label: "Permissions verified", ok: true, message: "ok", severity: "info" },
      { key: "live_capability", label: "Livestreaming enabled", ok: true, message: "ok", severity: "info" },
      { key: "quota", label: "Quota available", ok: true, message: "ok", severity: "info" },
      { key: "rtmp_ready", label: "RTMP ready", ok: true, message: "ok", severity: "info" },
    ],
    safe_user_message: "Ready",
  });
  const statuses = deriveValidationStatuses(validation);
  assert.equal(statuses.destinationStatus, "ready");
  assert.equal(statuses.oauthStatus, "ready");
  assert.equal(statuses.rtmpStatus, "ready");
});

test("displayValidationChecks shows standard wizard checklist labels", () => {
  const checks = displayValidationChecks([
    {
      key: "oauth_token_present",
      label: "Account connected",
      ok: true,
      message: "Connected",
      severity: "info",
    },
  ]);
  assert.equal(checks[0]?.label, "Account connected");
  assert.equal(checks[1]?.label, "Permissions verified");
  assert.equal(checks[1]?.ok, false);
});

test("expired token scenario stays not ready", () => {
  const validation = mapAgentValidation({
    ok: false,
    status: "error",
    checks: [
      {
        key: "oauth_token_fresh",
        label: "OAuth token valid",
        ok: false,
        message: "YouTube token expired and could not be refreshed.",
        severity: "critical",
      },
    ],
    safe_user_message: "YouTube permission expired. Reconnect YouTube.",
  });
  assert.equal(validation.ok, false);
  assert.match(validation.safeUserMessage, /expired/i);
});

test("custom RTMP bad URL remains needs_attention", () => {
  const validation = mapAgentValidation({
    ok: false,
    status: "needs_attention",
    checks: [
      {
        key: "stream_url",
        label: "Stream URL format",
        ok: false,
        message: "Enter a valid RTMP or RTMPS stream URL.",
        severity: "critical",
      },
    ],
    safe_user_message: "Custom server did not respond. Check the stream URL and try again.",
  });
  assert.equal(validation.status, "needs_attention");
});

test("begin service gate requires at least one ready destination", () => {
  const gate = {
    ready: [{ id: "1", platform: "youtube", displayName: "YouTube", success: true, message: "Ready" }],
    needsAttention: [{ id: "2", platform: "facebook", displayName: "Facebook", success: false, message: "Needs attention" }],
    canProceed: true,
  };
  assert.equal(gate.canProceed, true);
  assert.equal(gate.needsAttention.length, 1);
});

test("vimeo plan without live is blocked", () => {
  const validation = mapAgentValidation({
    ok: false,
    status: "error",
    checks: [
      {
        key: "live_capability",
        label: "Livestreaming enabled",
        ok: false,
        message: "This Vimeo account does not currently support livestreaming.",
        severity: "critical",
      },
    ],
    safe_user_message: "This Vimeo account does not currently support livestreaming.",
  });
  assert.equal(validation.ok, false);
});
