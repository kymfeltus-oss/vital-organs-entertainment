import test from "node:test";
import assert from "node:assert/strict";
import {
  computeDestinationHealth,
  estimateCombinedSetupTime,
  mapConnectionToOAuthStatus,
} from "../broadcast-catalog.ts";
import type { StreamingDestination } from "../../todays-service/types.ts";

function baseDestination(overrides: Partial<StreamingDestination> = {}): StreamingDestination {
  return {
    id: "dest-1",
    tenantId: "300-awakening",
    serviceId: "svc-1",
    destinationName: "YouTube Live",
    platform: "youtube",
    accountName: "Grace Community Church",
    accountEmail: null,
    channelId: "ch-1",
    channelName: "Grace Community Church",
    profileImageUrl: null,
    oauthPermissionsJson: { granted: ["youtube.force-ssl"] },
    oauthExpiresAt: new Date(Date.now() + 181 * 24 * 60 * 60 * 1000).toISOString(),
    lastAuthenticatedAt: new Date().toISOString(),
    lastStreamAt: null,
    streamCategory: null,
    scheduledStartAt: null,
    streamTags: [],
    videoProfileJson: {},
    audioProfileJson: {},
    encoderProfileJson: {},
    networkTestJson: {},
    connectionQuality: null,
    latencyMode: null,
    connectionStatus: "connected",
    selectedForToday: true,
    lastCheckedAt: new Date().toISOString(),
    lastSuccessfulTestAt: null,
    lastErrorMessage: null,
    oauthStatus: "connected",
    permissionStatus: "unknown",
    quotaStatus: "unknown",
    livePermissionStatus: "unknown",
    rtmpStatus: "unknown",
    destinationStatus: "not_connected",
    validationStatus: "not_validated",
    validationReason: null,
    lastValidatedAt: null,
    lastSuccessfulValidationAt: null,
    lastValidationError: null,
    websiteName: null,
    websiteUrl: null,
    streamPageUrl: null,
    embedMethod: null,
    liveStatus: "offline",
    broadcastExternalId: null,
    liveStartedAt: null,
    liveStoppedAt: null,
    liveDurationSeconds: null,
    connected: true,
    privacy: "public",
    streamTitle: "",
    streamDescription: "",
    thumbnailUrl: "",
    advancedJson: {},
    settingsJson: {},
    status: "ready",
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

test("computeDestinationHealth returns not connected without destination", () => {
  const health = computeDestinationHealth(null);
  assert.equal(health.status, "not_connected");
  assert.match(health.details.join(" "), /Authentication Required/);
});

test("computeDestinationHealth returns healthy with future oauth expiry", () => {
  const health = computeDestinationHealth(baseDestination());
  assert.equal(health.status, "healthy");
  assert.match(health.details.join(" "), /Token expires in/);
});

test("computeDestinationHealth returns expired when oauth is past", () => {
  const health = computeDestinationHealth(
    baseDestination({
      oauthExpiresAt: new Date(Date.now() - 60_000).toISOString(),
      connectionStatus: "connected",
    }),
  );
  assert.equal(health.status, "expired");
});

test("estimateCombinedSetupTime uses longest selected platform", () => {
  assert.equal(estimateCombinedSetupTime(["youtube", "facebook"]), "~45 seconds");
  assert.equal(estimateCombinedSetupTime(["custom_rtmp"]), "~2 minutes");
});

test("mapConnectionToOAuthStatus maps ready and expired", () => {
  assert.equal(mapConnectionToOAuthStatus("ready", null), "ready");
  assert.equal(
    mapConnectionToOAuthStatus("connected", new Date(Date.now() - 1000).toISOString()),
    "expired",
  );
});
