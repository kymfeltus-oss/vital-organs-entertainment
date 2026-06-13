/**
 * lib/live-hub/verify-pure.mjs
 *
 * Standalone validation script for Live Hub Go-Live logic.
 * Isolated scenario design: scenarios A, D, and E share a valid manifest URL.
 *
 * Run: node lib/live-hub/verify-pure.mjs
 */

import assert from "node:assert/strict";

// --- Shared pure helpers (mirrors lib/live-hub/readiness + preview) ---

function isVmixReachable(state) {
  if (!state) return false;
  if (state.connectionStatus === "unreachable" || state.connectionStatus === "disconnected") {
    return false;
  }
  if (state.isStale) return false;
  return state.connectionStatus === "connected";
}

function isValidManifest(url) {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    return parsed.pathname.toLowerCase().endsWith(".m3u8");
  } catch {
    return false;
  }
}

function resolveUploadSpeedStatus(uploadSpeedMbps) {
  if (uploadSpeedMbps === null || uploadSpeedMbps === undefined) return "pending";
  if (uploadSpeedMbps >= 10) return "pass";
  if (uploadSpeedMbps >= 5) return "warn";
  return "fail";
}

/**
 * Simplified scenario gate — maps screenshot-style snapshots to blocked/not blocked.
 * Upload fail threshold matches resolveUploadSpeed() (< 5 Mbps = fail → blocked).
 * Encoder must report READY (DISCONNECTED, ERROR, TIMEOUT all block).
 */
function simulateVmixCheck(status = "READY") {
  return { status };
}

function isEncoderReady(encoder) {
  return encoder?.status === "READY";
}

function evaluateScenarioGoLive(snapshot) {
  const blockers = [];
  const { metrics, streamConfig, encoder } = snapshot;

  if (metrics.uploadSpeed < 5.0) {
    blockers.push(
      `Upload Speed: ${metrics.uploadSpeed} Mbps (Insufficient — min 5.0)`,
    );
  }

  if (!isValidManifest(streamConfig.primaryUrl)) {
    blockers.push("Invalid or missing HLS Manifest (.m3u8 required)");
  }

  if (!isEncoderReady(encoder)) {
    blockers.push(`Encoder Status: ${encoder.status} (Connection required)`);
  }

  return {
    blocked: blockers.length > 0,
    blockers,
    canGoLive: blockers.length === 0,
  };
}

function evaluateGoLiveBlocked(input) {
  const critical = [];
  if (!input.networkOnline) critical.push("network");
  if (!isVmixReachable(input.vmix)) critical.push("vmix");
  if (!input.primaryConfigured) critical.push("primary");
  if (input.stripeApiLive === false && !input.devSandbox) critical.push("stripe");
  if (!input.contentReady) critical.push("content");
  if (!input.teamAligned) critical.push("team");
  return critical.length > 0;
}

function normalizeSource(value) {
  const trimmed = (value ?? "").trim().toLowerCase();
  if (trimmed === "primary" || trimmed === "backup") return trimmed;
  return "offline";
}

function resolveOpsPreviewPlaybackUrl(input) {
  const activeSource = normalizeSource(input.activeSource);
  const primary = isValidManifest(input.primaryPlaybackUrl)
    ? input.primaryPlaybackUrl.trim()
    : null;
  const backup = isValidManifest(input.backupPlaybackUrl)
    ? input.backupPlaybackUrl.trim()
    : null;

  if (activeSource === "primary") return primary;
  if (activeSource === "backup") return backup;
  return null;
}

function deriveOpsPreviewStreamState(isLive, playbackUrl) {
  if (isLive && playbackUrl) return "live";
  if (isLive && !playbackUrl) return "standby";
  if (!isLive && playbackUrl) return "standby";
  return "offline";
}

// --- Assert-based unit checks ---

const connectedVmix = {
  connectionStatus: "connected",
  isStale: false,
  isRecording: true,
  audioMasterLevel: 50,
};

assert.equal(isVmixReachable(connectedVmix), true);
assert.equal(isVmixReachable({ ...connectedVmix, isStale: true }), false);
assert.equal(isVmixReachable(null), false);

const readyInput = {
  networkOnline: true,
  vmix: connectedVmix,
  primaryConfigured: true,
  stripeApiLive: true,
  contentReady: true,
  teamAligned: true,
};

assert.equal(evaluateGoLiveBlocked(readyInput), false);
assert.equal(evaluateGoLiveBlocked({ ...readyInput, networkOnline: false }), true);
assert.equal(evaluateGoLiveBlocked({ ...readyInput, vmix: null }), true);
assert.equal(evaluateGoLiveBlocked({ ...readyInput, stripeApiLive: false }), true);
assert.equal(
  evaluateGoLiveBlocked({ ...readyInput, stripeApiLive: false, devSandbox: true }),
  false,
);
assert.equal(evaluateGoLiveBlocked({ ...readyInput, contentReady: false }), true);
assert.equal(evaluateGoLiveBlocked({ ...readyInput, teamAligned: false }), true);

const validM3u8 = "https://cdn.example.com/live/main.m3u8";
const invalidRestream = "https://restream.io";

assert.equal(isValidManifest(validM3u8), true);
assert.equal(isValidManifest(invalidRestream), false);
assert.equal(isValidManifest("rtmp://legacy.provider.com/live"), false);

assert.equal(
  resolveOpsPreviewPlaybackUrl({
    activeSource: "primary",
    primaryPlaybackUrl: validM3u8,
    backupPlaybackUrl: invalidRestream,
  }),
  validM3u8,
);

assert.equal(
  resolveOpsPreviewPlaybackUrl({
    activeSource: "primary",
    primaryPlaybackUrl: invalidRestream,
    backupPlaybackUrl: validM3u8,
  }),
  null,
);

assert.equal(
  resolveOpsPreviewPlaybackUrl({
    activeSource: "offline",
    primaryPlaybackUrl: validM3u8,
    backupPlaybackUrl: validM3u8,
  }),
  null,
);

assert.equal(deriveOpsPreviewStreamState(true, validM3u8), "live");
assert.equal(deriveOpsPreviewStreamState(true, null), "standby");
assert.equal(deriveOpsPreviewStreamState(false, validM3u8), "standby");
assert.equal(deriveOpsPreviewStreamState(false, null), "offline");

assert.equal(resolveUploadSpeedStatus(20), "pass");
assert.equal(resolveUploadSpeedStatus(10), "pass");
assert.equal(resolveUploadSpeedStatus(7), "warn");
assert.equal(resolveUploadSpeedStatus(4), "fail");
assert.equal(resolveUploadSpeedStatus(null), "pending");

// --- Scenario suite (screenshot-aligned fail-closed paths) ---

function runScenarioTests() {
  console.log("--------------------------------------------------");
  console.log("LIVE HUB LOGIC VALIDATION (ISOLATED GATE TEST)");
  console.log("--------------------------------------------------\n");

  const VALID_MANIFEST = "https://edge.cdn.com/live/main.m3u8";

  const testCases = [
    {
      id: "A",
      name: "Low Bandwidth (Blocked only by Upload)",
      snapshot: {
        metrics: { uploadSpeed: 4.0 },
        streamConfig: { primaryUrl: VALID_MANIFEST },
        encoder: { status: "READY" },
      },
      expectedBlocked: true,
    },
    {
      id: "B",
      name: "Invalid Manifest Format",
      snapshot: {
        metrics: { uploadSpeed: 15.0 },
        streamConfig: { primaryUrl: "rtmp://edge.cdn.com/live/main" },
        encoder: { status: "READY" },
      },
      expectedBlocked: true,
    },
    {
      id: "C",
      name: "System Ready (All Gates Pass)",
      snapshot: {
        metrics: { uploadSpeed: 18.5 },
        streamConfig: { primaryUrl: VALID_MANIFEST },
        encoder: { status: "READY" },
      },
      expectedBlocked: false,
    },
    {
      id: "D",
      name: "Encoder DISCONNECTED (Isolated check)",
      snapshot: {
        metrics: { uploadSpeed: 20.0 },
        streamConfig: { primaryUrl: VALID_MANIFEST },
        encoder: { status: "DISCONNECTED" },
      },
      expectedBlocked: true,
    },
    {
      id: "E",
      name: "vMix API Error (Isolated check)",
      snapshot: {
        metrics: { uploadSpeed: 20.0 },
        streamConfig: { primaryUrl: VALID_MANIFEST },
        encoder: { status: "ERROR" },
      },
      expectedBlocked: true,
    },
  ];

  let passedTests = 0;

  for (const testCase of testCases) {
    const result = evaluateScenarioGoLive(testCase.snapshot);
    const isCorrect = result.blocked === testCase.expectedBlocked;

    if (isCorrect) passedTests += 1;

    console.log(
      `[${isCorrect ? "PASS" : "FAIL"}] Scenario ${testCase.id}: ${testCase.name}`,
    );
    if (result.blocked) {
      console.log(`      Blocking Issues: ${result.blockers.join(", ")}`);
    } else {
      console.log("      Status: READY TO GO LIVE");
    }
    console.log("-".repeat(50));
  }

  console.log(`\nFINAL RESULTS: ${passedTests}/${testCases.length} PASSED`);
  console.log("--------------------------------------------------");

  if (passedTests !== testCases.length) {
    throw new Error("Scenario suite failed — safety gates not responding correctly.");
  }

  console.log("Fail-closed scenario security verified.");
}

runScenarioTests();
console.log("live-hub pure function verification passed");
