/**
 * Lightweight verification for live-hub pure functions.
 * Run: node lib/live-hub/verify-pure.mjs
 */

import assert from "node:assert/strict";

function isVmixReachable(state) {
  if (!state) return false;
  if (state.connectionStatus === "unreachable" || state.connectionStatus === "disconnected") {
    return false;
  }
  if (state.isStale) return false;
  return state.connectionStatus === "connected";
}

function evaluateGoLiveBlocked(input) {
  const critical = [];
  if (!input.networkOnline) critical.push("network");
  if (!isVmixReachable(input.vmix)) critical.push("vmix");
  if (!input.primaryConfigured) critical.push("primary");
  return critical.length > 0;
}

const connectedVmix = {
  connectionStatus: "connected",
  isStale: false,
  isRecording: true,
  audioMasterLevel: 50,
};

assert.equal(isVmixReachable(connectedVmix), true);
assert.equal(isVmixReachable({ ...connectedVmix, isStale: true }), false);
assert.equal(isVmixReachable(null), false);

assert.equal(
  evaluateGoLiveBlocked({
    networkOnline: true,
    vmix: connectedVmix,
    primaryConfigured: true,
  }),
  false,
);

assert.equal(
  evaluateGoLiveBlocked({
    networkOnline: false,
    vmix: connectedVmix,
    primaryConfigured: true,
  }),
  true,
);

assert.equal(
  evaluateGoLiveBlocked({
    networkOnline: true,
    vmix: null,
    primaryConfigured: true,
  }),
  true,
);

function normalizeSource(value) {
  const trimmed = (value ?? "").trim().toLowerCase();
  if (trimmed === "primary" || trimmed === "backup") return trimmed;
  return "offline";
}

function isValidHlsUrl(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    return parsed.pathname.toLowerCase().endsWith(".m3u8");
  } catch {
    return false;
  }
}

function resolveOpsPreviewPlaybackUrl(input) {
  const activeSource = normalizeSource(input.activeSource);
  const primary = isValidHlsUrl(input.primaryPlaybackUrl)
    ? input.primaryPlaybackUrl.trim()
    : null;
  const backup = isValidHlsUrl(input.backupPlaybackUrl)
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

const validM3u8 = "https://cdn.example.com/live/main.m3u8";
const invalidRestream = "https://restream.io";

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

console.log("live-hub pure function verification passed");
