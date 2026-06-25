import {
  agentOAuthCallback,
  agentOAuthStart,
  agentPrepareBroadcast,
  agentStartBroadcast,
  agentStopBroadcast,
  agentValidateDestination,
  isStreamingAgentConfigured,
} from "@/lib/streaming/agent";
import { prepareLocalEncoder, startLocalEncoder } from "@/lib/streaming/encoder";
import { plainEnglishStreamingError } from "@/lib/streaming/errors";
import { publishStreamingLiveUpdate } from "@/lib/streaming/events";
import { normalizePlatform, platformMeta } from "@/lib/streaming/platforms";
import { toPublicStreamingDestination } from "@/lib/streaming/map";
import { ensureFreshAccessToken } from "@/lib/streaming/token";
import {
  normalizeChurchWebsiteSettings,
} from "@/lib/streaming/church-website-shared";
import { validateChurchWebsiteSettings } from "@/lib/streaming/church-website";
import type {
  CreateStreamingDestinationInput,
  StreamingGoLiveResult,
  StreamingOAuthStartResult,
  StreamingStopAllResult,
  StreamingStopDestinationResult,
  StreamingTestResult,
  StreamingValidationResult,
} from "@/lib/streaming/types";
import type { StreamingLiveStatus } from "@/lib/streaming/live-status";
import {
  isMidBroadcastLiveStatus,
  shouldStopStreamingLiveStatus,
  STREAMING_LIVE_STATUS_DEFAULT,
} from "@/lib/streaming/live-status";
import { deriveValidationStatuses, validationToTestResult } from "@/lib/streaming/validation";
import {
  createStreamingDestination,
  deleteStreamingDestination,
  getOrCreateTodayService,
  getStreamingDestinationSecrets,
  listStreamingDestinations,
  updateStreamingDestination,
  writeAuditLog,
} from "@/lib/todays-service/repository";
import type { StreamingDestination } from "@/lib/todays-service/types";
import {
  assertStreamingSetupProfilesSchema,
  assertStreamingValidationSchema,
} from "@/lib/todays-service/streaming-schema";

function oauthRedirectUri(provider: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/api/v1/streaming/oauth/${provider}/callback`;
}

async function broadcastStreamingState(tenantId: string, serviceId: string): Promise<void> {
  const destinations = await listStreamingDestinations(serviceId);
  await publishStreamingLiveUpdate({
    tenantId,
    destinations,
    at: new Date().toISOString(),
  });
}

async function setDestinationLiveStatus(
  tenantId: string,
  serviceId: string,
  destinationId: string,
  liveStatus: StreamingLiveStatus,
  patch: Partial<StreamingDestination> = {},
): Promise<StreamingDestination> {
  const updated = await updateStreamingDestination(destinationId, { liveStatus, ...patch });
  await broadcastStreamingState(tenantId, serviceId);
  return updated;
}

function existingSettingsValue(dest: StreamingDestination, key: string): string | null {
  const value = (dest.settingsJson as Record<string, unknown> | null | undefined)?.[key];
  return typeof value === "string" ? value : null;
}

async function mapChurchWebsiteValidation(
  normalized: ReturnType<typeof normalizeChurchWebsiteSettings>,
): Promise<StreamingValidationResult> {
  const result = await validateChurchWebsiteSettings(normalized);
  return {
    ok: result.ok,
    status: result.status,
    safeUserMessage: result.reason,
    checks: result.checks.map((check) => ({
      key: check.key,
      label: check.label,
      ok: check.ok,
      message: check.message,
      severity: check.severity,
    })),
  };
}

export async function listPublicStreamingDestinations(tenantId: string) {
  const service = await getOrCreateTodayService(tenantId);
  const items = await listStreamingDestinations(service.id);
  return items.map(toPublicStreamingDestination);
}

export async function getStreamingDestinationForTenant(
  id: string,
  tenantId: string,
): Promise<StreamingDestination | null> {
  const service = await getOrCreateTodayService(tenantId);
  const items = await listStreamingDestinations(service.id);
  return items.find((d) => d.id === id) ?? null;
}

export async function createStreamingDestinationAccount(
  tenantId: string,
  userId: string,
  userEmail: string | null,
  input: CreateStreamingDestinationInput,
): Promise<ReturnType<typeof toPublicStreamingDestination>> {
  const service = await getOrCreateTodayService(tenantId);
  const meta = platformMeta(input.platform);
  const normalizedChurchWebsite =
    input.platform === "church_website"
      ? normalizeChurchWebsiteSettings({
          websiteName: String((input.settings as { websiteName?: unknown })?.websiteName ?? ""),
          websiteUrl: String((input.settings as { websiteUrl?: unknown })?.websiteUrl ?? ""),
          streamPageUrl: String((input.settings as { streamPageUrl?: unknown })?.streamPageUrl ?? input.streamUrl ?? ""),
          embedMethod: String((input.settings as { embedMethod?: unknown })?.embedMethod ?? "iframe"),
        })
      : null;

  const item = await createStreamingDestination(service.id, tenantId, {
    destinationName:
      normalizedChurchWebsite?.websiteName ||
      input.displayName ||
      meta?.label ||
      input.platform,
    platform: input.platform,
    settingsJson:
      input.platform === "church_website"
        ? normalizedChurchWebsite ?? {}
        : input.settings ?? {},
    connectionStatus: input.platform === "custom_rtmp" || input.platform === "church_website" ? "connected" : "not_connected",
    connected: input.platform === "custom_rtmp" || input.platform === "church_website",
    liveStatus: STREAMING_LIVE_STATUS_DEFAULT,
    streamUrl:
      input.platform === "church_website"
        ? normalizedChurchWebsite?.streamPageUrl ?? null
        : input.streamUrl ?? null,
    streamKey: input.streamKey ?? null,
    backupStreamUrl: input.backupStreamUrl ?? null,
    websiteName: normalizedChurchWebsite?.websiteName ?? null,
    websiteUrl: normalizedChurchWebsite?.websiteUrl ?? null,
    streamPageUrl: normalizedChurchWebsite?.streamPageUrl ?? null,
    embedMethod: normalizedChurchWebsite?.embedMethod ?? null,
    validationStatus: "not_validated",
    validationReason: null,
  });

  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "streaming_destination_create",
    detailJson: { destinationId: item.id, platform: input.platform },
  });

  await broadcastStreamingState(tenantId, service.id);
  return toPublicStreamingDestination(item);
}

export async function deleteStreamingDestinationAccount(
  id: string,
  tenantId: string,
  userId: string,
  userEmail: string | null,
): Promise<{ success: boolean; message: string }> {
  const dest = await getStreamingDestinationForTenant(id, tenantId);
  if (!dest) throw new Error("Destination not found.");

  if (isMidBroadcastLiveStatus(dest.liveStatus)) {
    await stopStreamingDestination(id, tenantId, userId, userEmail);
  }

  await deleteStreamingDestination(id);
  await writeAuditLog({
    tenantId,
    serviceId: dest.serviceId,
    userId,
    userEmail,
    action: "streaming_destination_delete",
    detailJson: { destinationId: id, platform: dest.platform },
  });
  await broadcastStreamingState(tenantId, dest.serviceId);
  return { success: true, message: "Destination deleted." };
}

export async function startStreamingOAuth(
  tenantId: string,
  provider: string,
  destinationId: string,
): Promise<StreamingOAuthStartResult> {
  const dest = await getStreamingDestinationForTenant(destinationId, tenantId);
  if (!dest) throw new Error("Destination not found.");

  const normalized = normalizePlatform(provider);
  if (!isStreamingAgentConfigured()) {
    return {
      configured: false,
      authorizationUrl: null,
      developmentMessage:
        "Streaming account connection is not configured in this development environment. You can add OAuth credentials, use Custom Streaming Server, or continue setup and connect later.",
    };
  }

  const state = Buffer.from(JSON.stringify({ destinationId, tenantId, provider: normalized })).toString("base64url");
  return agentOAuthStart(String(normalized), state, oauthRedirectUri(String(normalized)));
}

export async function completeStreamingOAuth(
  tenantId: string,
  provider: string,
  code: string,
  state: string,
  userId: string,
  userEmail: string | null,
): Promise<{ success: boolean; message: string }> {
  const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
    destinationId: string;
    tenantId: string;
  };
  if (parsed.tenantId !== tenantId) throw new Error("Invalid OAuth state.");

  const dest = await getStreamingDestinationForTenant(parsed.destinationId, tenantId);
  if (!dest) throw new Error("Destination not found.");

  const normalized = normalizePlatform(provider);
  const result = await agentOAuthCallback(String(normalized), code, oauthRedirectUri(String(normalized)));
  const tokens = result.tokens;
  const expiresIn = typeof tokens.expires_in === "number" ? tokens.expires_in : 3600;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  await updateStreamingDestination(dest.id, {
    accountName: result.accountName,
    accountEmail: result.accountEmail ?? null,
    channelId: result.channelId ?? null,
    channelName: result.channelName ?? null,
    profileImageUrl: result.profileImageUrl ?? null,
    oauthPermissionsJson: { granted: result.permissions ?? [] },
    connectionStatus: "connected",
    connected: true,
    oauthAccessToken: typeof tokens.access_token === "string" ? tokens.access_token : null,
    oauthRefreshToken: typeof tokens.refresh_token === "string" ? tokens.refresh_token : null,
    oauthExpiresAt: expiresAt,
    lastCheckedAt: new Date().toISOString(),
    lastAuthenticatedAt: new Date().toISOString(),
    lastErrorMessage: null,
  });

  await writeAuditLog({
    tenantId,
    serviceId: dest.serviceId,
    userId,
    userEmail,
    action: "streaming_oauth_connect",
    detailJson: { destinationId: dest.id, platform: normalized },
  });

  await broadcastStreamingState(tenantId, dest.serviceId);
  return { success: true, message: `${result.accountName} connected.` };
}

export async function updateStreamingDestinationAccount(
  id: string,
  tenantId: string,
  patch: Parameters<typeof updateStreamingDestination>[1],
): Promise<ReturnType<typeof toPublicStreamingDestination>> {
  const existing = await getStreamingDestinationForTenant(id, tenantId);
  if (!existing) throw new Error("Destination not found.");

  const normalizedPatch = { ...patch } as Parameters<typeof updateStreamingDestination>[1];
  if (normalizePlatform(existing.platform) === "church_website") {
    const settings = (patch.settingsJson ?? existing.settingsJson) as Record<string, unknown>;
    const normalized = normalizeChurchWebsiteSettings({
      websiteName: String(patch.websiteName ?? settings.websiteName ?? existing.websiteName ?? existing.destinationName ?? ""),
      websiteUrl: String(patch.websiteUrl ?? settings.websiteUrl ?? existing.websiteUrl ?? ""),
      streamPageUrl: String(patch.streamPageUrl ?? patch.streamUrl ?? settings.streamPageUrl ?? existing.streamPageUrl ?? ""),
      embedMethod: String(patch.embedMethod ?? settings.embedMethod ?? existing.embedMethod ?? "iframe"),
    });
    normalizedPatch.destinationName = normalized.websiteName || existing.destinationName;
    normalizedPatch.settingsJson = {
      ...settings,
      websiteName: normalized.websiteName,
      websiteUrl: normalized.websiteUrl,
      streamPageUrl: normalized.streamPageUrl,
      embedMethod: normalized.embedMethod,
    };
    normalizedPatch.streamUrl = normalized.streamPageUrl;
    normalizedPatch.websiteName = normalized.websiteName;
    normalizedPatch.websiteUrl = normalized.websiteUrl;
    normalizedPatch.streamPageUrl = normalized.streamPageUrl;
    normalizedPatch.embedMethod = normalized.embedMethod;
    normalizedPatch.validationStatus = "not_validated";
    normalizedPatch.validationReason = null;
    normalizedPatch.lastValidationError = null;
  }

  const updated = await updateStreamingDestination(id, normalizedPatch);
  await broadcastStreamingState(tenantId, updated.serviceId);
  return toPublicStreamingDestination(updated);
}

export async function validateStreamingDestination(
  id: string,
  tenantId: string,
  userId: string,
  userEmail: string | null,
): Promise<StreamingTestResult> {
  await assertStreamingValidationSchema();
  const dest = await getStreamingDestinationForTenant(id, tenantId);
  if (!dest) throw new Error("Destination not found.");

  const secrets = await getStreamingDestinationSecrets(id);
  const platform = normalizePlatform(dest.platform);
  const now = new Date().toISOString();

  await setDestinationLiveStatus(tenantId, dest.serviceId, id, "validating", {
    destinationStatus: "validating",
    lastValidatedAt: now,
  });

  let validation: StreamingValidationResult;
  try {
    if (platform === "church_website") {
      const normalized = normalizeChurchWebsiteSettings({
        websiteName: existingSettingsValue(dest, "websiteName") ?? dest.websiteName ?? dest.destinationName,
        websiteUrl: existingSettingsValue(dest, "websiteUrl") ?? dest.websiteUrl ?? "",
        streamPageUrl:
          existingSettingsValue(dest, "streamPageUrl") ??
          dest.streamPageUrl ??
          secrets?.streamUrl ??
          "",
        embedMethod: existingSettingsValue(dest, "embedMethod") ?? dest.embedMethod ?? "iframe",
      });
      validation = await mapChurchWebsiteValidation(normalized);
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/90113a7b-b2ce-449d-9c16-dbf632e3c139", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
        body: JSON.stringify({
          sessionId: "675ed0",
          runId: "church-website-validate",
          hypothesisId: "H-church-website-validation",
          location: "lib/streaming/service.ts:validateStreamingDestination",
          message: "church website validation result",
          data: { normalized, ok: validation.ok, status: validation.status, reason: validation.safeUserMessage },
          timestamp: Date.now(),
        }),
      }).catch(() => undefined);
      // #endregion
      await updateStreamingDestination(id, {
        destinationName: normalized.websiteName || dest.destinationName,
        settingsJson: {
          ...(dest.settingsJson ?? {}),
          websiteName: normalized.websiteName,
          websiteUrl: normalized.websiteUrl,
          streamPageUrl: normalized.streamPageUrl,
          embedMethod: normalized.embedMethod,
        },
        streamUrl: normalized.streamPageUrl || null,
        websiteName: normalized.websiteName || null,
        websiteUrl: normalized.websiteUrl || null,
        streamPageUrl: normalized.streamPageUrl || null,
        embedMethod: normalized.embedMethod,
      });
    } else if (isStreamingAgentConfigured()) {
      const accessToken = secrets
        ? await ensureFreshAccessToken(id, String(platform), secrets)
        : null;
      validation = await agentValidateDestination(String(platform), {
        accessToken,
        refreshToken: secrets?.oauthRefreshToken ?? null,
        tokenExpiresAt: dest.oauthExpiresAt,
        streamUrl: secrets?.streamUrl,
        streamKey: secrets?.streamKey,
        settings: dest.settingsJson,
        videoProfile: dest.videoProfileJson,
        audioProfile: dest.audioProfileJson,
        privacy: dest.privacy,
        scheduledStartAt: dest.scheduledStartAt,
      });
    } else if (platform === "custom_rtmp") {
      const hasCredentials = Boolean(secrets?.streamUrl || dest.settingsJson.streamPageUrl);
      validation = {
        ok: hasCredentials,
        status: hasCredentials ? "ready" : "needs_attention",
        checks: [
          {
            key: "oauth_token_present",
            label: "Account connected",
            ok: true,
            message: "Connection details saved.",
            severity: "info",
          },
          {
            key: "rtmp_ready",
            label: "RTMP ready",
            ok: hasCredentials,
            message: hasCredentials ? "Stream key saved securely." : "Add connection details first.",
            severity: hasCredentials ? "info" : "critical",
          },
        ],
        safeUserMessage: hasCredentials ? "Connection details saved." : "Add connection details first.",
      };
    } else {
      validation = {
        ok: false,
        status: "error",
        checks: [
          {
            key: "provider_configured",
            label: "Platform configured",
            ok: false,
            message: `${platformMeta(platform)?.label ?? platform} connection is not configured in this development environment.`,
            severity: "critical",
          },
        ],
        safeUserMessage: `${platformMeta(platform)?.label ?? platform} connection is not configured in this development environment.`,
      };
    }
  } catch (error) {
    validation = {
      ok: false,
      status: "error",
      checks: [
        {
          key: "validation",
          label: "Validation",
          ok: false,
          message: plainEnglishStreamingError(error, String(platform)),
          severity: "critical",
        },
      ],
      safeUserMessage: plainEnglishStreamingError(error, String(platform)),
    };
  }

  const result = validationToTestResult(validation);
  const statuses = deriveValidationStatuses(validation);

  await updateStreamingDestination(id, {
    connectionStatus: validation.ok ? "ready" : validation.status === "error" ? "error" : "needs_attention",
    connected: validation.ok || dest.connectionStatus === "connected",
    status: validation.ok ? "ready" : "needs_attention",
    lastCheckedAt: now,
    lastSuccessfulTestAt: validation.ok ? now : dest.lastSuccessfulTestAt,
    lastErrorMessage: validation.ok ? null : validation.safeUserMessage,
    liveStatus: validation.ok ? "ready" : validation.status === "error" ? "error" : "needs_attention",
    oauthStatus: statuses.oauthStatus,
    permissionStatus: statuses.permissionStatus,
    quotaStatus: statuses.quotaStatus,
    livePermissionStatus: statuses.livePermissionStatus,
    rtmpStatus: statuses.rtmpStatus,
    destinationStatus: statuses.destinationStatus,
    validationStatus: validation.ok ? "ready" : validation.status === "error" ? "error" : "needs_attention",
    validationReason: validation.ok ? null : validation.safeUserMessage,
    validationChecksJson: validation.checks.map((check) => ({
      key: check.key,
      label: check.label,
      ok: check.ok,
      message: check.message,
      severity: check.severity,
    })),
    lastValidatedAt: now,
    lastSuccessfulValidationAt: validation.ok ? now : dest.lastSuccessfulValidationAt,
    lastValidationError: validation.ok ? null : validation.safeUserMessage,
  });

  await writeAuditLog({
    tenantId,
    serviceId: dest.serviceId,
    userId,
    userEmail,
    action: "streaming_validate",
    detailJson: { destinationId: id, success: validation.ok, status: validation.status },
  });

  await broadcastStreamingState(tenantId, dest.serviceId);
  return result;
}

export async function testStreamingDestinationAccount(
  id: string,
  tenantId: string,
  userId: string,
  userEmail: string | null,
): Promise<StreamingTestResult> {
  return validateStreamingDestination(id, tenantId, userId, userEmail);
}

export async function disconnectStreamingDestinationAccount(
  id: string,
  tenantId: string,
  userId: string,
  userEmail: string | null,
): Promise<{ success: boolean; message: string }> {
  const dest = await getStreamingDestinationForTenant(id, tenantId);
  if (!dest) throw new Error("Destination not found.");

  await updateStreamingDestination(id, {
    connectionStatus: "not_connected",
    connected: false,
    accountName: null,
    accountEmail: null,
    channelId: null,
    channelName: null,
    profileImageUrl: null,
    oauthPermissionsJson: {},
    lastAuthenticatedAt: null,
    oauthAccessToken: null,
    oauthRefreshToken: null,
    oauthExpiresAt: null,
    streamKey: null,
    lastErrorMessage: null,
    liveStatus: STREAMING_LIVE_STATUS_DEFAULT,
    broadcastExternalId: null,
  });

  await writeAuditLog({
    tenantId,
    serviceId: dest.serviceId,
    userId,
    userEmail,
    action: "streaming_disconnect",
    detailJson: { destinationId: id },
  });

  await broadcastStreamingState(tenantId, dest.serviceId);
  return { success: true, message: "Disconnected." };
}

export async function setStreamingDestinationUseToday(
  id: string,
  tenantId: string,
  selected: boolean,
  userId: string,
  userEmail: string | null,
): Promise<void> {
  const dest = await getStreamingDestinationForTenant(id, tenantId);
  if (!dest) throw new Error("Destination not found.");
  await updateStreamingDestination(id, { selectedForToday: selected });
  await writeAuditLog({
    tenantId,
    serviceId: dest.serviceId,
    userId,
    userEmail,
    action: selected ? "streaming_use_today" : "streaming_skip_today",
    detailJson: { destinationId: id },
  });
  await broadcastStreamingState(tenantId, dest.serviceId);
}

export async function validateStreamingForGoLive(tenantId: string): Promise<StreamingGoLiveResult> {
  const service = await getOrCreateTodayService(tenantId);
  const destinations = await listStreamingDestinations(service.id);
  const selected = destinations.filter((d) => d.selectedForToday);

  const ready: StreamingGoLiveResult["ready"] = [];
  const needsAttention: StreamingGoLiveResult["needsAttention"] = [];

  for (const dest of selected) {
    const test = await validateStreamingDestination(dest.id, tenantId, "system", null);
    const entry = {
      id: dest.id,
      platform: dest.platform,
      displayName: dest.destinationName,
      success: test.success,
      message: test.message,
    };
    if (test.success) ready.push(entry);
    else needsAttention.push(entry);
  }

  return {
    ready,
    needsAttention,
    canProceed: ready.length > 0,
  };
}

async function startSingleDestination(
  dest: StreamingDestination,
  tenantId: string,
  userId: string,
  userEmail: string | null,
): Promise<{ success: boolean; message: string }> {
  const platform = normalizePlatform(dest.platform);
  const secrets = await getStreamingDestinationSecrets(dest.id);
  const oauthPlatform = platform !== "custom_rtmp" && platform !== "church_website";

  if (!isStreamingAgentConfigured()) {
    return {
      success: false,
      message: "Streaming server unavailable. Start the local production agent on this computer.",
    };
  }

  await setDestinationLiveStatus(tenantId, dest.serviceId, dest.id, "preparing");

  try {
    const accessToken =
      oauthPlatform && secrets
        ? await ensureFreshAccessToken(dest.id, String(platform), secrets)
        : null;

    if (oauthPlatform && !accessToken) {
      throw new Error(`${dest.destinationName} is not connected. Please reconnect your account.`);
    }

    const broadcastCtx = {
      accessToken,
      title: dest.streamTitle,
      description: dest.streamDescription,
      settings: dest.settingsJson,
      streamUrl: secrets?.streamUrl,
      streamKey: secrets?.streamKey,
      destinationId: dest.id,
      broadcastId: dest.broadcastExternalId,
    };

    await setDestinationLiveStatus(tenantId, dest.serviceId, dest.id, "preparing");
    const prepared = await agentPrepareBroadcast(String(platform), broadcastCtx);

    const broadcastId =
      typeof prepared.broadcastId === "string"
        ? prepared.broadcastId
        : typeof prepared.broadcast_id === "string"
          ? prepared.broadcast_id
          : dest.broadcastExternalId;

    if (broadcastId) {
      await updateStreamingDestination(dest.id, { broadcastExternalId: broadcastId });
    }

    const ingestUrl =
      typeof prepared.ingestionAddress === "string"
        ? prepared.ingestionAddress
        : typeof prepared.streamUrl === "string"
          ? prepared.streamUrl
          : typeof prepared.secureStreamUrl === "string"
            ? prepared.secureStreamUrl
            : secrets?.streamUrl;

    const ingestKey =
      typeof prepared.streamName === "string"
        ? prepared.streamName
        : typeof prepared.stream_key === "string"
          ? prepared.stream_key
          : secrets?.streamKey;

    if (ingestUrl && ingestKey) {
      const encoderPrepared = await prepareLocalEncoder({
        destinationId: dest.id,
        streamUrl: ingestUrl,
        streamKey: ingestKey,
      });
      if (!encoderPrepared.success) {
        throw new Error(encoderPrepared.message);
      }
    }

    if (ingestUrl && ingestKey) {
      const encoderStarted = await startLocalEncoder({
        destinationId: dest.id,
        streamUrl: ingestUrl,
        streamKey: ingestKey,
      });
      if (!encoderStarted.success) {
        throw new Error(encoderStarted.message);
      }
    }

    const started = await agentStartBroadcast(String(platform), {
      ...broadcastCtx,
      broadcastId,
    });

    if (started.started === false) {
      throw new Error(String(started.message ?? "Stream did not go live."));
    }

    const startedAt = new Date().toISOString();
    await setDestinationLiveStatus(tenantId, dest.serviceId, dest.id, "live", {
      connectionStatus: "ready",
      connected: true,
      broadcastExternalId: broadcastId,
      liveStartedAt: startedAt,
      liveStoppedAt: null,
      lastErrorMessage: null,
    });

    return { success: true, message: `${dest.destinationName} is live.` };
  } catch (error) {
    const message = plainEnglishStreamingError(error, String(platform));
    await setDestinationLiveStatus(tenantId, dest.serviceId, dest.id, "needs_attention", {
      connectionStatus: "needs_attention",
      lastErrorMessage: message,
    });
    return { success: false, message };
  }
}

export async function prepareAndStartStreaming(
  tenantId: string,
  userId: string,
  userEmail: string | null,
  skipDestinationIds: string[] = [],
): Promise<StreamingGoLiveResult> {
  const service = await getOrCreateTodayService(tenantId);
  const allDestinations = await listStreamingDestinations(service.id);
  if (allDestinations.length === 0) {
    return { ready: [], needsAttention: [], canProceed: true };
  }

  const destinations = allDestinations.filter(
    (d) => d.selectedForToday && !skipDestinationIds.includes(d.id),
  );

  if (destinations.length === 0) {
    return { ready: [], needsAttention: [], canProceed: false };
  }

  const ready: StreamingGoLiveResult["ready"] = [];
  const needsAttention: StreamingGoLiveResult["needsAttention"] = [];

  for (const dest of destinations) {
    const validation = await validateStreamingDestination(dest.id, tenantId, userId, userEmail);
    const entry = {
      id: dest.id,
      platform: dest.platform,
      displayName: dest.destinationName,
      success: validation.success,
      message: validation.message,
    };
    if (!validation.success) {
      needsAttention.push(entry);
      continue;
    }

    const outcome = await startSingleDestination(dest, tenantId, userId, userEmail);
    const liveEntry = {
      ...entry,
      success: outcome.success,
      message: outcome.message,
    };
    if (outcome.success) ready.push(liveEntry);
    else needsAttention.push(liveEntry);
  }

  await broadcastStreamingState(tenantId, service.id);
  return { ready, needsAttention, canProceed: ready.length > 0 };
}

export async function stopStreamingDestination(
  id: string,
  tenantId: string,
  userId: string,
  userEmail: string | null,
): Promise<StreamingStopDestinationResult> {
  const dest = await getStreamingDestinationForTenant(id, tenantId);
  if (!dest) throw new Error("Destination not found.");

  const platform = normalizePlatform(dest.platform);
  await setDestinationLiveStatus(tenantId, dest.serviceId, id, "stopping");

  let success = false;
  let message = "Stream stopped.";
  const stoppedAt = new Date().toISOString();
  let durationSeconds: number | null = null;

  if (dest.liveStartedAt) {
    durationSeconds = Math.max(0, Math.round((Date.parse(stoppedAt) - Date.parse(dest.liveStartedAt)) / 1000));
  }

  try {
    const secrets = await getStreamingDestinationSecrets(id);

    if (platform === "custom_rtmp" || platform === "church_website") {
      const { stopLocalEncoder } = await import("@/lib/streaming/encoder");
      const encoder = await stopLocalEncoder();
      success = encoder.success;
      message = encoder.message;
      if (isStreamingAgentConfigured()) {
        await agentStopBroadcast(String(platform), {
          accessToken: "",
          broadcastId: dest.broadcastExternalId,
          settings: dest.settingsJson,
          streamUrl: secrets?.streamUrl,
          streamKey: secrets?.streamKey,
          destinationId: dest.id,
        });
      }
    } else if (secrets?.oauthAccessToken && isStreamingAgentConfigured()) {
      const accessToken = await ensureFreshAccessToken(id, String(platform), secrets);
      if (accessToken) {
        await agentStopBroadcast(String(platform), {
          accessToken,
          broadcastId: dest.broadcastExternalId,
          settings: dest.settingsJson,
          streamUrl: secrets.streamUrl,
          streamKey: secrets.streamKey,
          destinationId: dest.id,
        });
        const { stopLocalEncoder } = await import("@/lib/streaming/encoder");
        await stopLocalEncoder();
        success = true;
      } else {
        message = `${dest.destinationName} permission expired. Please reconnect your account.`;
      }
    } else if (dest.liveStatus === "offline") {
      success = true;
      message = `${dest.destinationName} is already offline.`;
    } else {
      message = `Unable to stop ${dest.destinationName}. Streaming agent unavailable.`;
    }
  } catch (error) {
    message = plainEnglishStreamingError(error, String(platform));
  }

  await setDestinationLiveStatus(tenantId, dest.serviceId, id, "offline", {
    liveStoppedAt: stoppedAt,
    liveDurationSeconds: durationSeconds,
    lastErrorMessage: success ? null : message,
  });

  await writeAuditLog({
    tenantId,
    serviceId: dest.serviceId,
    userId,
    userEmail,
    action: success ? "streaming_stop" : "streaming_stop_failed",
    detailJson: { destinationId: id, platform, durationSeconds, message },
  });

  // #region agent log
  fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
    body: JSON.stringify({
      sessionId: "675ed0",
      runId: "streaming-stop",
      hypothesisId: "H-stream-stop",
      location: "lib/streaming/service.ts:stopStreamingDestination",
      message: "destination stop complete",
      data: { id, platform, success, liveStatus: "offline" },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return {
    id,
    platform: dest.platform,
    displayName: dest.destinationName,
    success,
    message,
    liveStatus: STREAMING_LIVE_STATUS_DEFAULT,
  };
}

export async function stopAllStreamingDestinations(
  tenantId: string,
  userId: string,
  userEmail: string | null,
): Promise<StreamingStopAllResult> {
  const service = await getOrCreateTodayService(tenantId);
  const destinations = await listStreamingDestinations(service.id);
  const active = destinations.filter((d) => shouldStopStreamingLiveStatus(d.liveStatus));

  const targets = active.length > 0 ? active : destinations.filter((d) => d.selectedForToday);

  const results: StreamingStopDestinationResult[] = [];
  for (const dest of targets) {
    if (dest.liveStatus === "offline" && !dest.liveStartedAt) continue;
    results.push(await stopStreamingDestination(dest.id, tenantId, userId, userEmail));
  }

  const stoppedAt = new Date().toISOString();
  const success = results.length === 0 || results.some((r) => r.success);

  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "streaming_stop_all",
    detailJson: { count: results.length, results },
  });

  await broadcastStreamingState(tenantId, service.id);

  // #region agent log
  fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
    body: JSON.stringify({
      sessionId: "675ed0",
      runId: "streaming-stop-all",
      hypothesisId: "H-stream-stop-all",
      location: "lib/streaming/service.ts:stopAllStreamingDestinations",
      message: "stop all complete",
      data: { count: results.length, success },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return {
    success,
    message: results.length ? "All active streams stopped." : "No active streams to stop.",
    destinations: results,
    stoppedAt,
  };
}

export async function getStreamingWizardDefaults(tenantId: string): Promise<import("@/lib/streaming/types").StreamingWizardDefaults> {
  const { createDefaultChurchWebsiteSettings } = await import("@/lib/streaming/church-website-shared");
  const service = await getOrCreateTodayService(tenantId);
  const title = service.serviceName?.trim() || "Sunday Service Live";
  const scheduled = service.serviceDate ? `${service.serviceDate}T10:00:00` : null;
  return {
    streamTitle: title,
    streamDescription: `Join us for ${title}.`,
    scheduledStartAt: scheduled,
    category: "Religion & Spirituality",
    privacy: "public",
    tags: ["church", "live", "worship"],
    churchWebsite: createDefaultChurchWebsiteSettings(),
  };
}

export async function runStreamingNetworkTest(
  tenantId: string,
  destinationId: string,
  userId: string,
  userEmail: string | null,
  videoProfile?: Record<string, unknown>,
): Promise<import("@/lib/streaming/setup").StreamingNetworkTest> {
  const dest = await getStreamingDestinationForTenant(destinationId, tenantId);
  if (!dest) throw new Error("Destination not found.");

  const { runInternetSpeedTest } = await import("@/lib/todays-service/service");
  const { recommendedBitrateKbps, parseVideoProfile } = await import("@/lib/streaming/setup");

  const speed = await runInternetSpeedTest(tenantId);
  const profile = parseVideoProfile(videoProfile ?? dest.videoProfileJson);
  const recommended = recommendedBitrateKbps(speed.uploadMbps, profile.resolution, profile.fps);

  const jitterMs =
    typeof (speed as { jitterMs?: number }).jitterMs === "number"
      ? (speed as { jitterMs?: number }).jitterMs!
      : Math.max(0, 100 - speed.stabilityScore);
  const packetLoss =
    typeof (speed as { packetLossPercent?: number }).packetLossPercent === "number"
      ? (speed as { packetLossPercent?: number }).packetLossPercent!
      : 0;

  const networkTest = {
    success: speed.success,
    uploadMbps: speed.uploadMbps,
    downloadMbps: speed.downloadMbps,
    latencyMs: speed.latencyMs,
    packetLossPercent: packetLoss,
    jitterMs,
    recommendedBitrateKbps: recommended,
    streamingQuality: speed.streamingQuality,
    testedAt: new Date().toISOString(),
    message: speed.message,
  };

  await updateStreamingDestination(destinationId, {
    networkTestJson: networkTest,
    connectionQuality: speed.streamingQuality,
  });

  await writeAuditLog({
    tenantId,
    serviceId: dest.serviceId,
    userId,
    userEmail,
    action: "streaming_network_test",
    detailJson: { destinationId, networkTest },
  });

  return networkTest;
}

export async function saveStreamingWizardProfile(
  tenantId: string,
  userId: string,
  userEmail: string | null,
  input: import("@/lib/streaming/types").StreamingWizardSaveInput,
): Promise<ReturnType<typeof toPublicStreamingDestination>> {
  await assertStreamingSetupProfilesSchema();
  const dest = await getStreamingDestinationForTenant(input.destinationId, tenantId);
  if (!dest) throw new Error("Destination not found.");

  const patch: Parameters<typeof updateStreamingDestination>[1] = {
    selectedForToday: input.selectedForToday ?? true,
  };
  if (input.streamTitle !== undefined) patch.streamTitle = input.streamTitle;
  if (input.streamDescription !== undefined) patch.streamDescription = input.streamDescription;
  if (input.streamCategory !== undefined) patch.streamCategory = input.streamCategory;
  if (input.privacy !== undefined) patch.privacy = input.privacy;
  if (input.thumbnailUrl !== undefined) patch.thumbnailUrl = input.thumbnailUrl;
  if (input.scheduledStartAt !== undefined) patch.scheduledStartAt = input.scheduledStartAt;
  if (input.streamTags !== undefined) patch.streamTags = input.streamTags;
  if (input.videoProfile !== undefined) patch.videoProfileJson = input.videoProfile;
  if (input.audioProfile !== undefined) patch.audioProfileJson = input.audioProfile;
  if (input.encoderProfile !== undefined) patch.encoderProfileJson = input.encoderProfile;
  if (input.networkTest !== undefined) patch.networkTestJson = input.networkTest;
  if (input.connectionQuality !== undefined) patch.connectionQuality = input.connectionQuality as typeof dest.connectionQuality;
  if (input.latencyMode !== undefined) patch.latencyMode = input.latencyMode;

  const updated = await updateStreamingDestination(input.destinationId, patch);

  if (input.markReady) {
    const validation = await validateStreamingDestination(input.destinationId, tenantId, userId, userEmail);
    if (!validation.success) {
      throw new Error(validation.message);
    }
    return toPublicStreamingDestination(
      await getStreamingDestinationForTenant(input.destinationId, tenantId) ?? updated,
    );
  }

  await writeAuditLog({
    tenantId,
    serviceId: dest.serviceId,
    userId,
    userEmail,
    action: input.markReady ? "streaming_wizard_complete" : "streaming_wizard_save",
    detailJson: { destinationId: input.destinationId, markReady: Boolean(input.markReady) },
  });

  await broadcastStreamingState(tenantId, dest.serviceId);
  const { loadTodaysService } = await import("@/lib/todays-service/service");
  await loadTodaysService(tenantId, undefined, { purpose: "mutation" }).catch(() => undefined);
  return toPublicStreamingDestination(updated);
}
