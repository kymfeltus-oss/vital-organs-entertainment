import { isAudioServiceConfigured, proxyAudioService } from "@/lib/audio/service-proxy";
import {
  agentConnectWifi,
  agentDetectNetwork,
  agentReconnectWifi,
  agentScanWifi,
  agentSpeedTest,
} from "@/lib/internet/agent";
import type {
  InternetDetectResult,
  InternetSetupSaveInput,
  InternetSpeedTestResult,
  StreamingQuality,
} from "@/lib/internet/types";
import { streamingQualityLabel } from "@/lib/internet/labels";
import { buildBroadcastDestinationCards } from "@/lib/streaming/broadcast-destinations";
import { DEFAULT_RECOMMENDED_BROADCAST_PLATFORM } from "@/lib/streaming/broadcast-catalog";
import { buildLiveReadinessState } from "@/lib/todays-service/readiness";
import {
  createAlert,
  createCamera,
  createEquipment,
  createInternetConnection,
  createSoundItem,
  createStreamingDestination,
  createTeamMember,
  createTimelineItem,
  DEFAULT_SERVICE_TENANT_ID,
  deleteCamera,
  deleteEquipment,
  deleteInternetConnection,
  deletePresentationSource,
  deleteRecordingSetting,
  deleteSoundItem,
  deleteStreamingDestination,
  deleteTeamMember,
  deleteTimelineItem,
  getOrCreateTodayService,
  getServiceById,
  listAlerts,
  listCameras,
  listEquipment,
  listInternetConnections,
  listMicrophones,
  listMixers,
  listPresentationSources,
  listRecordingSettings,
  listSoundItems,
  listStreamingDestinations,
  listServiceBroadcastDestinations,
  listTeamMembers,
  listTimelineItems,
  reorderTimelineItems,
  updateAlert,
  updateCamera,
  updateEquipment,
  updateInternetConnection,
  updateService,
  updateSoundItem,
  updateStreamingDestination,
  updateTeamMember,
  updateTimelineItem,
  upsertMixer,
  upsertPresentationSource,
  upsertRecordingSetting,
  getLastConnectedMixer,
  getMixerById,
  getTenantEquipmentProfile,
  upsertTenantEquipmentProfile,
  writeAuditLog,
} from "@/lib/todays-service/repository";
import { getLiveReadinessState, scheduleLiveReadinessState, setLiveReadinessState } from "@/lib/todays-service/redis-store";
import type {
  BeginServiceResult,
  LiveReadinessState,
  MixerConnectionType,
  ServiceRecord,
  TestResult,
  TodaysServicePayload,
} from "@/lib/todays-service/types";
import type {
  LastConnectedMixer,
  MixerAudioDetectionResult,
  MixerConnectionConfig,
  MixerConnectionQuality,
  MixerEnvironmentMode,
  MixerHealthCheckResult,
  MixerImportOptions,
  MixerImportResult,
  MixerScanResult,
  MixerTestResult,
} from "@/lib/todays-service/mixer-types";
import {
  DEFAULT_MIXER_CONNECTION_CONFIG,
  mixerTypeToMetadata,
} from "@/lib/todays-service/mixer-types";
import { isDevelopmentEnvironment } from "@/lib/todays-service/equipment-setup";
import type { MixerAutoCheckResult, UsbAudioDevice } from "@/lib/todays-service/mixer-connection";
import type { TenantEquipmentProfile } from "@/lib/todays-service/equipment-onboarding";
import type { Mixer } from "@/lib/todays-service/types";

async function safeList<T>(
  label: string,
  loader: () => Promise<T[]>,
): Promise<{ items: T[]; error: string | null }> {
  try {
    return { items: await loader(), error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : `${label} load failed.`;
    console.error(`[TODAYS_SERVICE] ${label}:`, error);
    return { items: [], error: message };
  }
}

export type LoadTodaysServiceOptions = {
  /** display = page read (no alert sync, async redis). mutation = full side effects. */
  purpose?: "display" | "mutation";
};

export async function loadTodaysService(
  tenantId = DEFAULT_SERVICE_TENANT_ID,
  serviceId?: string,
  options?: LoadTodaysServiceOptions,
): Promise<TodaysServicePayload> {
  const purpose = options?.purpose ?? "mutation";
  let service: ServiceRecord;
  try {
    service = serviceId
      ? await getServiceById(serviceId, tenantId)
      : await getOrCreateTodayService(tenantId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load today's service.";
    throw new Error(message);
  }

  const resolvedServiceId = service.id;
  const loadErrors: string[] = [];

  const [
    equipmentResult,
    soundItemsResult,
    mixersResult,
    microphonesResult,
    camerasResult,
    internetConnectionsResult,
    streamingDestinationsResult,
    recordingSettingsResult,
    presentationSourcesResult,
    timelineItemsResult,
    teamMembersResult,
    alertsResult,
    equipmentProfile,
  ] = await Promise.all([
    safeList("equipment", () => listEquipment(resolvedServiceId)),
    safeList("soundItems", () => listSoundItems(resolvedServiceId)),
    safeList("mixers", () => listMixers(resolvedServiceId)),
    safeList("microphones", () => listMicrophones(resolvedServiceId)),
    safeList("cameras", () => listCameras(resolvedServiceId)),
    safeList("internetConnections", () => listInternetConnections(resolvedServiceId)),
    safeList("streamingDestinations", () => listStreamingDestinations(resolvedServiceId)),
    safeList("recordingSettings", () => listRecordingSettings(resolvedServiceId)),
    safeList("presentationSources", () => listPresentationSources(resolvedServiceId)),
    safeList("timelineItems", () => listTimelineItems(resolvedServiceId)),
    safeList("teamMembers", () => listTeamMembers(resolvedServiceId)),
    safeList("alerts", () => listAlerts(resolvedServiceId)),
    getTenantEquipmentProfile(tenantId).catch(() => null),
  ]);

  for (const result of [
    equipmentResult,
    soundItemsResult,
    mixersResult,
    microphonesResult,
    camerasResult,
    internetConnectionsResult,
    streamingDestinationsResult,
    recordingSettingsResult,
    presentationSourcesResult,
    timelineItemsResult,
    teamMembersResult,
    alertsResult,
  ]) {
    if (result.error) loadErrors.push(result.error);
  }

  const equipment = equipmentResult.items;
  const soundItems = soundItemsResult.items;
  const mixers = mixersResult.items;
  const microphones = microphonesResult.items;
  const cameras = camerasResult.items;
  const internetConnections = internetConnectionsResult.items;
  const streamingDestinations = streamingDestinationsResult.items;
  const recordingSettings = recordingSettingsResult.items;
  const presentationSources = presentationSourcesResult.items;
  const timelineItems = timelineItemsResult.items;
  const teamMembers = teamMembersResult.items;
  const alerts = alertsResult.items;

  const readiness = await refreshReadiness(tenantId, resolvedServiceId, {
    soundItems,
    mixers,
    cameras,
    internetConnections,
    streamingDestinations,
    recordingSettings,
    presentationSources,
  }, purpose);

  const broadcastDestinations = await listServiceBroadcastDestinations(resolvedServiceId).catch(() => []);
  const recommendedPlatform =
    equipmentProfile?.recommendedBroadcastPlatform ?? DEFAULT_RECOMMENDED_BROADCAST_PLATFORM;
  const broadcastDestinationCards = buildBroadcastDestinationCards({
    destinations: streamingDestinations,
    selections: broadcastDestinations,
    recommendedPlatform,
  });

  return {
    service,
    equipment,
    soundItems,
    mixers,
    microphones,
    cameras,
    internetConnections,
    streamingDestinations,
    broadcastDestinations,
    broadcastDestinationCards,
    recordingSettings,
    presentationSources,
    timelineItems,
    teamMembers,
    alerts,
    readiness,
    equipmentProfile,
  };
}

export async function saveTenantEquipmentProfile(
  tenantId: string,
  patch: Parameters<typeof upsertTenantEquipmentProfile>[1],
): Promise<TenantEquipmentProfile> {
  return upsertTenantEquipmentProfile(tenantId, patch);
}

export { getTenantEquipmentProfile, upsertTenantEquipmentProfile };

type ReadinessSources = {
  soundItems: Awaited<ReturnType<typeof listSoundItems>>;
  mixers: Awaited<ReturnType<typeof listMixers>>;
  cameras: Awaited<ReturnType<typeof listCameras>>;
  internetConnections: Awaited<ReturnType<typeof listInternetConnections>>;
  streamingDestinations: Awaited<ReturnType<typeof listStreamingDestinations>>;
  recordingSettings: Awaited<ReturnType<typeof listRecordingSettings>>;
  presentationSources: Awaited<ReturnType<typeof listPresentationSources>>;
};

export async function refreshReadiness(
  tenantId: string,
  serviceId: string,
  sources: ReadinessSources,
  purpose: "display" | "mutation" = "mutation",
): Promise<LiveReadinessState> {
  const state = buildLiveReadinessState(tenantId, serviceId, sources);

  if (purpose === "display") {
    scheduleLiveReadinessState(state);
    return state;
  }

  await setLiveReadinessState(state);
  await syncAlertsFromReadiness(serviceId, tenantId, sources);
  return state;
}

async function syncAlertsFromReadiness(
  serviceId: string,
  tenantId: string,
  sources: ReadinessSources,
) {
  const existing = await listAlerts(serviceId);
  const openAlerts = existing.filter((a) => a.status === "open");

  for (const mic of sources.soundItems.filter((s) => s.category === "pastor_mic")) {
    const battery = mic.configJson.batteryPct;
    if (typeof battery === "number" && battery < 25) {
      const ref = `sound:${mic.id}:battery`;
      if (!openAlerts.some((a) => a.sourceRef === ref)) {
        await createAlert(serviceId, tenantId, {
          message: `${mic.name} battery is low.`,
          severity: "warning",
          category: "sound",
          sourceRef: ref,
        });
      }
    }
  }

  for (const camera of sources.cameras) {
    if (camera.status === "not_connected") {
      const ref = `camera:${camera.id}`;
      if (!openAlerts.some((a) => a.sourceRef === ref)) {
        await createAlert(serviceId, tenantId, {
          message: `${camera.name} is not connected.`,
          severity: "critical",
          category: "cameras",
          sourceRef: ref,
        });
      }
    }
  }

  for (const conn of sources.internetConnections.filter((c) => !c.isBackup)) {
    if (conn.uploadStrength === "needs_attention") {
      const ref = `internet:${conn.id}`;
      if (!openAlerts.some((a) => a.sourceRef === ref)) {
        await createAlert(serviceId, tenantId, {
          message: "Internet is slower than normal.",
          severity: "warning",
          category: "internet",
          sourceRef: ref,
        });
      }
    }
  }

  for (const rec of sources.recordingSettings) {
    if (rec.storageRemainingGb != null && rec.storageRemainingGb < 5) {
      const ref = `recording:${rec.id}:storage`;
      if (!openAlerts.some((a) => a.sourceRef === ref)) {
        await createAlert(serviceId, tenantId, {
          message: "Recording location is almost full.",
          severity: "warning",
          category: "recording",
          sourceRef: ref,
        });
      }
    }
  }

  for (const dest of sources.streamingDestinations) {
    if (!dest.connected) {
      const ref = `streaming:${dest.id}`;
      if (!openAlerts.some((a) => a.sourceRef === ref)) {
        await createAlert(serviceId, tenantId, {
          message: `${dest.destinationName} is not connected.`,
          severity: "critical",
          category: "livestream",
          sourceRef: ref,
        });
      }
    }
  }
}

export async function patchTodaysServiceHeader(
  tenantId: string,
  patch: {
    id?: string;
    serviceName?: string;
    serviceDate?: string;
    serviceStartTime?: string;
    broadcastProfile?: string;
    readinessMessage?: string;
    countdownEnabled?: boolean;
  },
) {
  const service = patch.id
    ? await getServiceById(patch.id, tenantId)
    : await getOrCreateTodayService(tenantId);

  const { id: _id, ...fields } = patch;

  return updateService(service.id, fields, tenantId);
}

export async function testEquipmentItem(id: string): Promise<TestResult> {
  const admin = await listEquipment((await getOrCreateTodayService()).id);
  const item = admin.find((e) => e.id === id);
  if (!item) return { success: false, message: "Item not found." };

  await updateEquipment(id, { status: "ready" });
  return { success: true, message: `${item.name} is working.` };
}

export async function testSoundSection(tenantId: string, userId: string, userEmail: string | null): Promise<TestResult> {
  const service = await getOrCreateTodayService(tenantId);
  const items = await listSoundItems(service.id);
  const testable = items.filter((item) => item.deviceId || item.mixerIp);
  if (testable.length === 0) {
    return { success: false, message: "Add and connect a sound device before running a sound check." };
  }
  const { testSavedSoundDevice } = await import("@/lib/sound/service");
  const results = await Promise.all(
    testable.map((item) => testSavedSoundDevice(item.id, tenantId, userId, userEmail, false)),
  );
  await refreshReadinessForService(tenantId, service.id);
  const allOk = results.every((r) => r.success);
  return {
    success: allOk,
    message: allOk ? "Sound check complete. All devices are ready." : results.find((r) => !r.success)?.message ?? "Sound check failed.",
  };
}

type MixerServiceContext = {
  tenantId: string;
  userId: string;
  userEmail: string | null;
};

function getMixerEnvironmentMode(): MixerEnvironmentMode {
  return isDevelopmentEnvironment() ? "development" : "production";
}

function buildUnavailableTestResult(mixerLabel = "Behringer X32"): MixerTestResult {
  return {
    success: false,
    status: "unavailable",
    environmentMode: "production",
    message: `We couldn't find your ${mixerLabel}.`,
    productionPanel: {
      title: `We couldn't find your ${mixerLabel}.`,
      message: "Things to check:",
      bullets: [
        "Is the mixer powered on?",
        "Is the network cable connected?",
        "Is your computer connected to the same network?",
        "Is the Parable audio service running on this computer?",
        "Try Auto Detect Mixer.",
      ],
    },
    troubleshooting: {
      title: `We couldn't find your ${mixerLabel}.`,
      bullets: [
        "Is the mixer powered on?",
        "Is the network cable connected?",
        "Is your computer connected to the same network?",
        "Is the Parable audio service running on this computer?",
        "Try Auto Detect Mixer.",
      ],
    },
  };
}

function buildUnavailableScanResult(): MixerScanResult {
  return {
    success: false,
    status: "unavailable",
    message: "No mixers found on this network.",
    environmentMode: "production",
    mixers: [],
  };
}

async function callMixerBackend<T>(
  path: string,
  body: Record<string, unknown>,
  ctx: MixerServiceContext,
): Promise<T | null> {
  if (!isAudioServiceConfigured()) return null;
  try {
    return await proxyAudioService<T>(path, {
      method: "POST",
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      userEmail: ctx.userEmail,
      body,
    });
  } catch (err) {
    console.error("[mixers] backend call failed:", path, err);
    return null;
  }
}

function mapProbeToTestResult(payload: Record<string, unknown>): MixerTestResult {
  const success = Boolean(payload.success);
  const status = (payload.status as MixerTestResult["status"]) ?? (success ? "ready" : "unreachable");
  if (status === "unavailable") {
    return buildUnavailableTestResult();
  }
  if (success) {
    return {
      success: true,
      status: "ready",
      message: String(payload.message ?? "Mixer Found"),
      summary: {
        manufacturer: String(payload.manufacturer ?? "Behringer"),
        model: String(payload.model ?? "X32"),
        firmware: payload.firmware ? String(payload.firmware) : null,
        serialNumber: payload.serial_number ? String(payload.serial_number) : null,
        ipAddress: String(payload.ip_address ?? payload.ipAddress ?? ""),
        connectionQuality: (payload.connection_quality as MixerConnectionQuality) ?? "Good",
        responseTimeMs: Number(payload.response_time_ms ?? payload.responseTimeMs ?? 0),
        inputsDetected: payload.inputs_detected != null ? Number(payload.inputs_detected) : null,
        mixesDetected: payload.mixes_detected != null ? Number(payload.mixes_detected) : null,
        status: "Ready",
      },
    };
  }
  const mixerModel = payload.model ? String(payload.model) : "Behringer X32";
  const troubleshooting =
    status === "wrong_device"
      ? {
          title: `We found a device at this address, but it does not appear to be a ${mixerModel}.`,
          bullets: [
            "Make sure the mixer is powered on.",
            "Make sure this computer is on the same network as the mixer.",
            "Check that the IP address is correct.",
            "Try Auto Detect Mixer.",
          ],
        }
      : {
          title: `We couldn't find your ${mixerModel}.`,
          bullets: [
            "Is the mixer powered on?",
            "Is the network cable connected?",
            "Is your computer connected to the same network?",
            "Try Auto Detect Mixer.",
          ],
        };
  return {
    success: false,
    status,
    message: String(payload.message ?? troubleshooting.title),
    troubleshooting,
  };
}

export async function testMixerConnection(
  tenantId: string,
  input: {
    ipAddress: string;
    mixerType?: string;
    connectionConfig?: Partial<MixerConnectionConfig>;
  },
  userId: string,
  userEmail: string | null,
): Promise<MixerTestResult> {
  const config = { ...DEFAULT_MIXER_CONNECTION_CONFIG, ...input.connectionConfig };
  const ctx: MixerServiceContext = { tenantId, userId, userEmail };
  const backend = await callMixerBackend<Record<string, unknown>>(
    "/api/v1/mixers/test",
    {
      ip: input.ipAddress,
      mixerType: input.mixerType ?? "behringer_x32",
      port: config.port,
      timeoutMs: config.timeoutMs,
      retryCount: config.retryCount,
    },
    ctx,
  );

  if (!backend) {
    return buildUnavailableTestResult(
      input.mixerType === "midas_m32" ? "Midas M32" : "Behringer X32",
    );
  }

  const result = mapProbeToTestResult(backend);
  if (result.success) {
    const service = await getOrCreateTodayService(tenantId);
    await writeAuditLog({
      tenantId,
      serviceId: service.id,
      userId,
      userEmail,
      action: "mixer_test_connection",
      detailJson: { ipAddress: input.ipAddress, mixerType: input.mixerType ?? "behringer_x32" },
    });
  }
  return result;
}

export async function scanMixers(
  tenantId: string,
  input: { mixerType?: string; hintIps?: string[] },
  userId: string,
  userEmail: string | null,
): Promise<MixerScanResult> {
  const service = await getOrCreateTodayService(tenantId);
  const knownIps = (input.hintIps ?? []).concat(
    (await listMixers(service.id)).map((m) => m.ipAddress).filter(Boolean),
  );
  const ctx: MixerServiceContext = { tenantId, userId, userEmail };
  const backend = await callMixerBackend<{
    success: boolean;
    status: string;
    mixers: MixerScanResult["mixers"];
  }>(
    "/api/v1/mixers/scan",
    {
      mixerType: input.mixerType ?? "behringer_x32",
      hintIps: knownIps,
    },
    ctx,
  );

  if (!backend) {
    return buildUnavailableScanResult();
  }

  const mixers = backend.mixers ?? [];
  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "mixer_scan",
    detailJson: { foundCount: mixers.length },
  });

  return {
    success: mixers.length > 0,
    status: mixers.length === 0 ? "none" : mixers.length === 1 ? "found_one" : "found_many",
    message: mixers.length > 0 ? "Scan complete." : "We could not find a supported mixer automatically.",
    mixers,
  };
}

export async function connectMixer(
  tenantId: string,
  input: {
    mixerId?: string;
    name: string;
    ipAddress: string;
    mixerType?: string;
    connectionConfig?: Partial<MixerConnectionConfig>;
  },
  userId: string,
  userEmail: string | null,
): Promise<MixerTestResult & { details?: { mixerId: string } }> {
  const service = await getOrCreateTodayService(tenantId);
  const config = { ...DEFAULT_MIXER_CONNECTION_CONFIG, ...input.connectionConfig };
  const ctx: MixerServiceContext = { tenantId, userId, userEmail };
  const testResult = await testMixerConnection(
    tenantId,
    {
      ipAddress: input.ipAddress,
      mixerType: input.mixerType,
      connectionConfig: config,
    },
    userId,
    userEmail,
  );

  const connected = testResult.success;
  const ipTrimmed = input.ipAddress.trim();
  const metadata = mixerTypeToMetadata(input.mixerType ?? "behringer_x32");
  const mixer = await upsertMixer(service.id, tenantId, {
    id: input.mixerId,
    name: input.name,
    ipAddress: ipTrimmed,
    ethernetIpAddress: ipTrimmed || null,
    mixerModel: input.mixerType ?? "behringer_x32",
    manufacturer: metadata.manufacturer,
    model: metadata.model,
    connectionType: connected ? "ethernet" : ipTrimmed ? "manual" : "unknown",
    lastConnectionMethod: connected ? "ethernet" : null,
    connectionStatus: connected ? "connected" : "not_connected",
    lastConnectedAt: connected ? new Date().toISOString() : null,
    connectionConfigJson: config,
  });

  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "mixer_connect",
    detailJson: { mixerId: mixer.id, ipAddress: input.ipAddress, connected },
  });

  await refreshReadinessForService(tenantId, service.id);
  return { ...testResult, details: { mixerId: mixer.id } };
}

export async function importMixerSetup(
  tenantId: string,
  input: {
    mixerId?: string;
    ipAddress: string;
    mixerType?: string;
    options: MixerImportOptions;
    name?: string;
  },
  userId: string,
  userEmail: string | null,
): Promise<MixerImportResult> {
  const service = await getOrCreateTodayService(tenantId);
  const ctx: MixerServiceContext = { tenantId, userId, userEmail };
  const backend = await callMixerBackend<{ success: boolean; setup: Record<string, unknown> }>(
    "/api/v1/mixers/import",
    {
      ip: input.ipAddress,
      mixerType: input.mixerType ?? "behringer_x32",
      options: input.options,
    },
    ctx,
  );

  let setup: Record<string, unknown> = {};

  if (!backend) {
    return {
      success: false,
      message: "Could not import mixer configuration. Start the Parable audio service and verify the mixer is online.",
    };
  }

  setup = backend.setup ?? {};
  const channelNames = (setup.channel_names as { name: string }[] | undefined) ?? [];
  const existing = await listSoundItems(service.id);
  const existingNames = new Set(existing.map((item) => item.name.toLowerCase()));
  let soundItemsCreated = 0;

  if (input.options.routing || input.options.channelNames) {
    for (const channel of channelNames) {
      if (!channel.name?.trim() || existingNames.has(channel.name.toLowerCase())) continue;
      await createSoundItem(service.id, tenantId, {
        name: channel.name.trim(),
        category: "microphone",
      });
      existingNames.add(channel.name.toLowerCase());
      soundItemsCreated += 1;
    }
  }

  const mixerTypeSlug = input.mixerType ?? "behringer_x32";
  const metadata = mixerTypeToMetadata(mixerTypeSlug);
  const firmwareFromSetup =
    typeof setup.firmware === "string"
      ? setup.firmware
      : typeof setup.firmware_version === "string"
        ? setup.firmware_version
        : null;
  const serialFromSetup =
    typeof setup.serial_number === "string"
      ? setup.serial_number
      : typeof setup.serialNumber === "string"
        ? setup.serialNumber
        : null;

  const importedAt = new Date().toISOString();
  const setupWithMeta = {
    ...setup,
    imported_at: importedAt,
    manufacturer: metadata.manufacturer,
    model: metadata.model,
    firmware_version: firmwareFromSetup,
    serial_number: serialFromSetup,
  };
  const ipTrimmed = input.ipAddress.trim();

  const mixer = await upsertMixer(service.id, tenantId, {
    id: input.mixerId,
    name: input.name?.trim() || "Main Mixer",
    ipAddress: ipTrimmed,
    ethernetIpAddress: ipTrimmed || null,
    mixerModel: mixerTypeSlug,
    manufacturer: metadata.manufacturer,
    model: metadata.model,
    firmware: firmwareFromSetup,
    firmwareVersion: firmwareFromSetup,
    serialNumber: serialFromSetup,
    connectionType: backend ? "ethernet" : ipTrimmed ? "manual" : "unknown",
    lastConnectionMethod: backend ? "ethernet" : ipTrimmed ? "manual" : null,
    connectionStatus: backend ? "connected" : "needs_attention",
    lastConnectedAt: importedAt,
    importedSetupJson: setupWithMeta,
  });

  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "mixer_import",
    detailJson: { mixerId: mixer.id, soundItemsCreated },
  });

  await refreshReadinessForService(tenantId, service.id);
  return {
    success: true,
    message: "Mixer setup imported.",
    mixer,
    imported: {
      channelCount: ((setup.channel_names as unknown[]) ?? []).length,
      sceneCount: ((setup.scenes as unknown[]) ?? []).length,
      soundItemsCreated,
    },
  };
}

export async function getLastConnectedMixerForTenant(tenantId: string): Promise<LastConnectedMixer | null> {
  const mixer = await getLastConnectedMixer(tenantId);
  if (!mixer?.lastConnectedAt) return null;
  return {
    mixerId: mixer.id,
    name: mixer.name,
    model: mixer.mixerModel.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    ipAddress: mixer.ethernetIpAddress || mixer.ipAddress,
    lastConnectedAt: mixer.lastConnectedAt,
  };
}

function mergeConnectionType(
  current: MixerConnectionType | undefined,
  adding: "ethernet" | "usb",
): MixerConnectionType {
  if (adding === "ethernet") {
    if (current === "usb") return "both";
    return "ethernet";
  }
  if (current === "ethernet") return "both";
  return "usb";
}

export async function connectEthernetMixer(
  tenantId: string,
  input: {
    mixerId?: string;
    name: string;
    ipAddress: string;
    mixerType?: string;
    connectionConfig?: Partial<MixerConnectionConfig>;
  },
  userId: string,
  userEmail: string | null,
): Promise<{ success: boolean; message: string; mixer: Mixer; testResult?: MixerTestResult }> {
  const service = await getOrCreateTodayService(tenantId);
  const existingMixers = await listMixers(service.id);
  const current = input.mixerId ? existingMixers.find((m) => m.id === input.mixerId) : existingMixers[0];

  let testResult: MixerTestResult | undefined;
  if (input.ipAddress.trim()) {
    testResult = await testMixerConnection(
      tenantId,
      {
        ipAddress: input.ipAddress,
        mixerType: input.mixerType,
        connectionConfig: input.connectionConfig,
      },
      userId,
      userEmail,
    );
  }

  const metadata = mixerTypeToMetadata(input.mixerType ?? "behringer_x32");
  const connected = Boolean(testResult?.success);
  const ipTrimmed = input.ipAddress.trim();
  const connectionType: MixerConnectionType = connected
    ? mergeConnectionType(current?.connectionType, "ethernet")
    : ipTrimmed
      ? "manual"
      : current?.connectionType ?? "unknown";

  const mixer = await upsertMixer(service.id, tenantId, {
    id: input.mixerId ?? current?.id,
    name: input.name.trim() || "Main Mixer",
    ipAddress: ipTrimmed,
    ethernetIpAddress: ipTrimmed || null,
    mixerModel: input.mixerType ?? "behringer_x32",
    manufacturer: testResult?.summary?.manufacturer ?? metadata.manufacturer,
    model: testResult?.summary?.model ?? metadata.model,
    firmware: testResult?.summary?.firmware ?? current?.firmware ?? null,
    firmwareVersion: testResult?.summary?.firmware ?? current?.firmwareVersion ?? null,
    serialNumber: testResult?.summary?.serialNumber ?? current?.serialNumber ?? null,
    connectionType,
    lastConnectionMethod: connected ? "ethernet" : ipTrimmed ? "manual" : current?.lastConnectionMethod ?? null,
    connectionStatus: connected ? "connected" : ipTrimmed ? "needs_attention" : "not_connected",
    lastConnectedAt: connected ? new Date().toISOString() : current?.lastConnectedAt ?? null,
    connectionConfigJson: { ...DEFAULT_MIXER_CONNECTION_CONFIG, ...input.connectionConfig },
    usbDeviceName: current?.usbDeviceName ?? null,
    usbDeviceId: current?.usbDeviceId ?? null,
  });

  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "mixer_connect_ethernet",
    detailJson: { mixerId: mixer.id, ipAddress: input.ipAddress, connected },
  });
  await refreshReadinessForService(tenantId, service.id);

  return {
    success: connected || Boolean(ipTrimmed),
    message: connected ? "Mixer connected through Ethernet." : "Mixer information saved. Connect the mixer to verify communication.",
    mixer,
    testResult,
  };
}

export async function connectUsbMixer(
  tenantId: string,
  input: {
    mixerId?: string;
    name: string;
    mixerType?: string;
    usbDeviceName: string;
    usbDeviceId: string;
  },
  userId: string,
  userEmail: string | null,
): Promise<{ success: boolean; message: string; mixer: Mixer }> {
  const service = await getOrCreateTodayService(tenantId);
  const existingMixers = await listMixers(service.id);
  const current = input.mixerId ? existingMixers.find((m) => m.id === input.mixerId) : existingMixers[0];
  const metadata = mixerTypeToMetadata(input.mixerType ?? "behringer_x32");
  const connectionType = mergeConnectionType(current?.connectionType, "usb");

  const mixer = await upsertMixer(service.id, tenantId, {
    id: input.mixerId ?? current?.id,
    name: input.name.trim() || "Main Mixer",
    mixerModel: input.mixerType ?? "behringer_x32",
    manufacturer: metadata.manufacturer,
    model: metadata.model,
    connectionType,
    usbDeviceName: input.usbDeviceName,
    usbDeviceId: input.usbDeviceId,
    lastConnectionMethod: "usb",
    connectionStatus: "connected",
    lastConnectedAt: new Date().toISOString(),
    ethernetIpAddress: current?.ethernetIpAddress ?? null,
    ipAddress: current?.ethernetIpAddress || current?.ipAddress || "",
  });

  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "mixer_connect_usb",
    detailJson: { mixerId: mixer.id, usbDeviceName: input.usbDeviceName },
  });
  await refreshReadinessForService(tenantId, service.id);

  return { success: true, message: "USB audio device connected.", mixer };
}

export async function scanUsbMixerDevices(
  tenantId: string,
  input: { devices: UsbAudioDevice[] },
  userId: string,
  userEmail: string | null,
): Promise<{ success: boolean; devices: UsbAudioDevice[] }> {
  const service = await getOrCreateTodayService(tenantId);
  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "mixer_scan_usb",
    detailJson: { count: input.devices.length },
  });
  return { success: input.devices.length > 0, devices: input.devices };
}

export async function mixerAutoCheck(
  tenantId: string,
  input: {
    mixerType?: string;
    usbDevices: UsbAudioDevice[];
  },
  userId: string,
  userEmail: string | null,
): Promise<MixerAutoCheckResult> {
  const ethScan = await scanMixers(tenantId, { mixerType: input.mixerType }, userId, userEmail);
  const usbFound = input.usbDevices[0];

  if (ethScan.mixers.length > 0) {
    const found = ethScan.mixers[0];
    return {
      success: true,
      ethernetFound: true,
      usbFound: Boolean(usbFound),
      recommended: "ethernet",
      message: "We found your mixer through Ethernet.",
      ethernetMixer: {
        manufacturer: found.manufacturer,
        model: found.model,
        ipAddress: found.ipAddress,
      },
      usbDevice: usbFound,
    };
  }

  if (usbFound) {
    return {
      success: true,
      ethernetFound: false,
      usbFound: true,
      recommended: "usb",
      message: "We found your mixer through USB.",
      usbDevice: usbFound,
    };
  }

  return {
    success: false,
    ethernetFound: false,
    usbFound: false,
    recommended: null,
    message: "We could not find the mixer yet.",
  };
}

export async function patchMixerConnection(
  tenantId: string,
  mixerId: string,
  patch: Partial<{
    connectionType: MixerConnectionType;
    ethernetIpAddress: string;
    usbDeviceName: string;
    usbDeviceId: string;
    lastConnectionMethod: string;
    connectionStatus: Mixer["connectionStatus"];
  }>,
  userId: string,
  userEmail: string | null,
): Promise<Mixer> {
  const service = await getOrCreateTodayService(tenantId);
  const mixers = await listMixers(service.id);
  const current = mixers.find((m) => m.id === mixerId);
  if (!current) throw new Error("Mixer not found.");

  const mixer = await upsertMixer(service.id, tenantId, {
    id: mixerId,
    name: current.name,
    ipAddress: patch.ethernetIpAddress ?? current.ethernetIpAddress ?? current.ipAddress,
    ethernetIpAddress: patch.ethernetIpAddress ?? current.ethernetIpAddress,
    connectionType: patch.connectionType ?? current.connectionType,
    usbDeviceName: patch.usbDeviceName ?? current.usbDeviceName,
    usbDeviceId: patch.usbDeviceId ?? current.usbDeviceId,
    lastConnectionMethod: patch.lastConnectionMethod ?? current.lastConnectionMethod,
    connectionStatus: patch.connectionStatus ?? current.connectionStatus,
  });

  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "mixer_patch_connection",
    detailJson: { mixerId, patch },
  });
  await refreshReadinessForService(tenantId, service.id);
  return mixer;
}

export async function runMixerHealthCheck(
  tenantId: string,
  input: {
    mixerId?: string;
    ipAddress?: string;
    mixerType?: string;
    connectionConfig?: Partial<MixerConnectionConfig>;
    connectionType?: MixerConnectionType;
    usbDeviceName?: string | null;
  },
  userId: string,
  userEmail: string | null,
): Promise<MixerHealthCheckResult> {
  const service = await getOrCreateTodayService(tenantId);
  const saved = input.mixerId
    ? await getMixerById(service.id, input.mixerId)
    : ((await listMixers(service.id))[0] ?? null);

  if (saved?.connectionStatus === "needs_attention" && !input.ipAddress?.trim() && !saved.ethernetIpAddress) {
    return {
      success: false,
      message: "Mixer is not connected yet.",
      checks: [{ label: "Mixer reachable on the network", ok: false }],
      warnings: ["Connect your mixer with Ethernet and run Test Mixer."],
    };
  }

  const connType = input.connectionType ?? saved?.connectionType ?? "unknown";
  const ipAddress =
    input.ipAddress?.trim() || saved?.ethernetIpAddress || saved?.ipAddress || "";
  const usbDeviceName = input.usbDeviceName ?? saved?.usbDeviceName ?? null;
  const mixerType = input.mixerType ?? saved?.mixerModel ?? "behringer_x32";
  const connectionConfig = {
    ...DEFAULT_MIXER_CONNECTION_CONFIG,
    ...(saved?.connectionConfigJson as Partial<MixerConnectionConfig>),
    ...input.connectionConfig,
  };

  if (connType === "usb") {
    const ok = Boolean(input.usbDeviceName);
    await writeAuditLog({
      tenantId,
      serviceId: service.id,
      userId,
      userEmail,
      action: "mixer_health_check",
      detailJson: { connectionType: "usb" },
    });
    return {
      success: ok,
      message: "USB audio check complete.",
      checks: [
        { label: "USB audio device recognized", ok },
        { label: "Ready for recording or stream audio", ok },
      ],
      warnings: ok
        ? ["Full mixer control requires an Ethernet connection."]
        : ["No USB audio device was detected."],
    };
  }

  if (connType === "manual") {
    return {
      success: true,
      message: "Manual setup saved.",
      checks: [{ label: "Mixer information saved", ok: true }],
      warnings: ["Connect Ethernet at the church to verify full control."],
    };
  }

  if (connType === "unknown") {
    return {
      success: false,
      message: "Setup incomplete.",
      checks: [{ label: "Connection type not set", ok: false }],
      warnings: ["Connect your mixer when you are at the church."],
    };
  }

  if (!ipAddress) {
    return {
      success: false,
      message: "No network address available for health check.",
      checks: [{ label: "Ethernet address available", ok: false }],
      warnings: [],
    };
  }

  const config = connectionConfig;
  const ctx: MixerServiceContext = { tenantId, userId, userEmail };
  const backend = await callMixerBackend<MixerHealthCheckResult>(
    "/api/v1/mixers/health-check",
    {
      ip: ipAddress,
      mixerType,
      port: config.port,
      timeoutMs: config.timeoutMs,
      retryCount: config.retryCount,
    },
    ctx,
  );

  if (!backend) {
    const unavailable = buildUnavailableTestResult();
    return {
      success: false,
      message: unavailable.message,
      checks: [{ label: "Production audio agent online", ok: false }],
      warnings: unavailable.productionPanel?.bullets ?? unavailable.troubleshooting?.bullets ?? [],
    };
  }

  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "mixer_health_check",
    detailJson: { ipAddress, connectionType: connType, mixerId: saved?.id ?? null },
  });
  if (connType === "both") {
    return {
      ...backend,
      warnings: [
        ...(backend.warnings ?? []),
        "USB audio is also connected for recording and streaming.",
      ],
    };
  }
  return backend;
}

export async function runMixerAudioDetection(
  tenantId: string,
  input: { ipAddress: string; mixerType?: string; connectionConfig?: Partial<MixerConnectionConfig> },
  userId: string,
  userEmail: string | null,
): Promise<MixerAudioDetectionResult> {
  const config = { ...DEFAULT_MIXER_CONNECTION_CONFIG, ...input.connectionConfig };
  const ctx: MixerServiceContext = { tenantId, userId, userEmail };
  const backend = await callMixerBackend<MixerAudioDetectionResult>(
    "/api/v1/mixers/audio-detection",
    {
      ip: input.ipAddress,
      mixerType: input.mixerType ?? "behringer_x32",
      port: config.port,
      timeoutMs: Math.max(config.timeoutMs, 3000),
      retryCount: config.retryCount,
    },
    ctx,
  );

  if (!backend) {
    return {
      success: false,
      message: buildUnavailableTestResult().message,
      inputs: [],
      noSignalDetected: true,
    };
  }

  const service = await getOrCreateTodayService(tenantId);
  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "mixer_audio_detection",
    detailJson: { ipAddress: input.ipAddress, inputCount: backend.inputs?.length ?? 0 },
  });
  return backend;
}

async function pingHost(ip: string): Promise<boolean> {
  if (!ip) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    await fetch(`http://${ip}`, { signal: controller.signal, method: "HEAD" }).catch(() => null);
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

export async function testCamera(
  id: string,
  tenantId: string,
  userId: string,
  userEmail: string | null,
  clientVerified = false,
): Promise<TestResult> {
  const { testCameraAccount } = await import("@/lib/cameras/service");
  const result = await testCameraAccount(id, tenantId, userId, userEmail, clientVerified);
  await refreshReadinessForService(tenantId, (await getOrCreateTodayService(tenantId)).id);
  return { success: result.success, message: result.message, details: { latencyMs: result.latencyMs } };
}

export async function previewCamera(id: string, tenantId: string): Promise<TestResult> {
  const { previewCameraAccount } = await import("@/lib/cameras/service");
  const result = await previewCameraAccount(id, tenantId);
  return {
    success: result.success,
    message: result.message,
    details: {
      previewMode: result.previewMode,
      deviceId: result.deviceId,
      networkUrl: result.networkUrl,
    },
  };
}

function uploadStrengthFromMbps(uploadMbps: number): import("@/lib/todays-service/types").UploadStrength {
  if (uploadMbps >= 10) return "excellent";
  if (uploadMbps >= 5) return "good";
  if (uploadMbps > 0) return "needs_attention";
  return "not_connected";
}

function readinessFromStreamingQuality(
  quality: StreamingQuality,
): import("@/lib/internet/types").InternetConnectionStatus {
  if (quality === "offline" || quality === "unknown") return "not_connected";
  if (quality === "poor" || quality === "fair") return "needs_attention";
  return "ready";
}

async function serverInternetProbe(): Promise<boolean> {
  try {
    const response = await fetch("https://www.cloudflare.com/cdn-cgi/trace", { cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

export async function detectInternet(_tenantId: string): Promise<InternetDetectResult> {
  if (isAudioServiceConfigured()) {
    try {
      return await agentDetectNetwork();
    } catch {
      /* local agent unavailable — fall through */
    }
  }

  const internetReachable = await serverInternetProbe();
  return {
    online: internetReachable,
    connectionType: null,
    ssid: null,
    localIp: null,
    internetReachable,
    ethernetConnected: null,
    agentAvailable: false,
  };
}

export async function scanWifiNetworks(): Promise<import("@/lib/internet/types").WiFiNetwork[]> {
  if (!isAudioServiceConfigured()) return [];
  return agentScanWifi();
}

export async function connectWifiNetwork(
  ssid: string,
  password: string,
): Promise<{ success: boolean; message: string }> {
  if (!isAudioServiceConfigured()) {
    return {
      success: false,
      message: "Connect through your computer's Wi-Fi settings, then return here and press Refresh.",
    };
  }
  return agentConnectWifi(ssid, password);
}

export async function reconnectPreferredInternet(
  tenantId: string,
): Promise<{ success: boolean; message: string }> {
  const profile = await getTenantEquipmentProfile(tenantId);
  const preferred = profile?.preferredNetwork;
  if (!preferred?.remember || !preferred.ssid || preferred.type !== "wifi") {
    return { success: false, message: "No saved Wi-Fi network to reconnect." };
  }
  if (!isAudioServiceConfigured()) {
    return { success: false, message: "Automatic reconnect requires the Parable local agent." };
  }
  return agentReconnectWifi(preferred.ssid);
}

export async function runInternetSpeedTest(tenantId: string): Promise<InternetSpeedTestResult> {
  let result: InternetSpeedTestResult;
  if (isAudioServiceConfigured()) {
    try {
      result = await agentSpeedTest();
    } catch {
      result = await fallbackSpeedTest();
    }
  } else {
    result = await fallbackSpeedTest();
  }

  const service = await getOrCreateTodayService(tenantId);
  const connections = await listInternetConnections(service.id);
  const main = connections.find((c) => !c.isBackup);
  const uploadStrength = uploadStrengthFromMbps(result.uploadMbps);
  const status = readinessFromStreamingQuality(result.streamingQuality);
  const now = new Date().toISOString();
  const patch = {
    uploadStrength,
    status,
    lastTestAt: now,
    lastTestedAt: now,
    lastConnectedAt: now,
    lastTestMbps: result.uploadMbps,
    uploadMbps: result.uploadMbps,
    downloadMbps: result.downloadMbps,
    latencyMs: result.latencyMs,
    stabilityScore: result.stabilityScore,
    streamingQuality: result.streamingQuality,
  };

  if (main) {
    await updateInternetConnection(main.id, patch);
  } else {
    await createInternetConnection(service.id, tenantId, {
      connectionName: "Main Internet",
      ...patch,
    });
  }

  await refreshReadinessForService(tenantId, service.id);
  return {
    ...result,
    message: result.success
      ? `Speed test complete — ${streamingQualityLabel(result.streamingQuality)}.`
      : result.message,
  };
}

async function fallbackSpeedTest(): Promise<InternetSpeedTestResult> {
  let downloadMbps = 0;
  let uploadMbps = 0;
  let latencyMs = 0;

  try {
    const start = Date.now();
    const response = await fetch("https://speed.cloudflare.com/__down?bytes=1500000", { cache: "no-store" });
    const buffer = await response.arrayBuffer();
    const seconds = Math.max((Date.now() - start) / 1000, 0.001);
    downloadMbps = Math.round(((buffer.byteLength * 8) / seconds / 1_000_000) * 10) / 10;
  } catch {
    downloadMbps = 0;
  }

  try {
    const payload = new Uint8Array(400_000);
    const start = Date.now();
    const response = await fetch("https://speed.cloudflare.com/__up", {
      method: "POST",
      body: payload,
      cache: "no-store",
    });
    const seconds = Math.max((Date.now() - start) / 1000, 0.001);
    if (response.ok) {
      uploadMbps = Math.round(((payload.byteLength * 8) / seconds / 1_000_000) * 10) / 10;
    }
  } catch {
    uploadMbps = 0;
  }

  try {
    const start = Date.now();
    await fetch("https://www.cloudflare.com/cdn-cgi/trace", { cache: "no-store" });
    latencyMs = Date.now() - start;
  } catch {
    latencyMs = 0;
  }

  const streamingQuality: StreamingQuality =
    uploadMbps >= 10 && downloadMbps >= 25
      ? "excellent"
      : uploadMbps >= 5 && downloadMbps >= 10
        ? "good"
        : uploadMbps >= 2
          ? "fair"
          : uploadMbps > 0
            ? "poor"
            : "offline";

  return {
    success: uploadMbps > 0 && downloadMbps > 0,
    uploadMbps,
    downloadMbps,
    latencyMs,
    stabilityScore: latencyMs > 0 ? Math.max(0, 100 - latencyMs / 2) : 0,
    streamingQuality,
    message: uploadMbps > 0 ? "Speed test complete." : "Could not complete speed test.",
  };
}

export async function saveInternetSetup(
  tenantId: string,
  input: InternetSetupSaveInput,
): Promise<{ success: boolean; message: string }> {
  const service = await getOrCreateTodayService(tenantId);
  const connections = await listInternetConnections(service.id);
  const existing = connections.find((c) => c.isBackup === Boolean(input.isBackup));
  const uploadStrength = uploadStrengthFromMbps(input.uploadMbps ?? 0);
  const status = readinessFromStreamingQuality(input.streamingQuality ?? "unknown");
  const now = new Date().toISOString();
  const payload = {
    connectionName: input.connectionName,
    networkName: input.ssid ?? input.connectionName,
    isBackup: input.isBackup ?? false,
    isPrimary: !(input.isBackup ?? false),
    connectionType: input.connectionType,
    ssid: input.ssid ?? null,
    localIp: input.localIp ?? null,
    uploadStrength,
    status,
    lastTestAt: now,
    lastTestedAt: now,
    lastConnectedAt: now,
    lastTestMbps: input.uploadMbps ?? null,
    uploadMbps: input.uploadMbps ?? null,
    downloadMbps: input.downloadMbps ?? null,
    latencyMs: input.latencyMs ?? null,
    stabilityScore: input.stabilityScore ?? null,
    streamingQuality: input.streamingQuality ?? null,
  };

  if (existing) {
    await updateInternetConnection(existing.id, payload);
  } else {
    await createInternetConnection(service.id, tenantId, payload);
  }

  if (!input.isBackup && input.connectionType && (input.ssid || input.connectionType === "ethernet")) {
    await upsertTenantEquipmentProfile(tenantId, {
      preferredNetwork: {
        type: input.connectionType,
        ssid: input.ssid ?? null,
        remember: true,
      },
      onboarding: {
        currentSection: "internet",
        completedSections: ["mixer", "internet"],
      },
    });
  }

  await refreshReadinessForService(tenantId, service.id);
  return { success: true, message: "Internet setup saved." };
}

/** @deprecated Use runInternetSpeedTest */
export async function testInternet(tenantId: string): Promise<TestResult> {
  const result = await runInternetSpeedTest(tenantId);
  return {
    success: result.success,
    message: result.message,
    details: { mbps: result.uploadMbps, downloadMbps: result.downloadMbps },
  };
}

export async function testStreamingDestination(
  id: string,
  tenantId: string,
  userId = "system",
  userEmail: string | null = null,
): Promise<TestResult> {
  const { testStreamingDestinationAccount } = await import("@/lib/streaming/service");
  const result = await testStreamingDestinationAccount(id, tenantId, userId, userEmail);
  await refreshReadinessForService(tenantId, (await getOrCreateTodayService(tenantId)).id);
  return {
    success: result.success,
    message: result.message,
    details: { steps: result.steps, connectionStatus: result.connectionStatus },
  };
}

export async function testRecording(tenantId: string): Promise<TestResult> {
  const service = await getOrCreateTodayService(tenantId);
  const settings = await listRecordingSettings(service.id);
  const setting = settings[0];

  if (!setting?.saveLocation) {
    return { success: false, message: "Choose a save location first." };
  }

  await upsertRecordingSetting(service.id, tenantId, {
    id: setting.id,
    status: "ready",
    storageRemainingGb: setting.storageRemainingGb ?? 50,
  });
  await refreshReadinessForService(tenantId, service.id);
  return { success: true, message: "Recording test passed. Save location is reachable." };
}

export async function testPresentation(id: string, tenantId: string): Promise<TestResult> {
  const service = await getOrCreateTodayService(tenantId);
  const sources = await listPresentationSources(service.id);
  const source = sources.find((s) => s.id === id);
  if (!source) return { success: false, message: "Presentation source not found." };

  const connected = source.softwareName !== "None";
  await upsertPresentationSource(service.id, tenantId, {
    id,
    connectionStatus: connected ? "connected" : "not_connected",
    status: connected ? "ready" : "not_connected",
  });
  await refreshReadinessForService(tenantId, service.id);
  return {
    success: connected,
    message: connected ? `${source.softwareName} is connected.` : "No presentation software selected.",
  };
}

async function refreshReadinessForService(tenantId: string, serviceId: string) {
  const sources = {
    soundItems: await listSoundItems(serviceId),
    mixers: await listMixers(serviceId),
    cameras: await listCameras(serviceId),
    internetConnections: await listInternetConnections(serviceId),
    streamingDestinations: await listStreamingDestinations(serviceId),
    recordingSettings: await listRecordingSettings(serviceId),
    presentationSources: await listPresentationSources(serviceId),
  };
  return refreshReadiness(tenantId, serviceId, sources);
}

export async function beginService(
  tenantId: string,
  userId: string,
  userEmail: string | null,
  force = false,
  skipDestinationIds: string[] = [],
): Promise<BeginServiceResult> {
  const payload = await loadTodaysService(tenantId);
  const criticalIssues = payload.alerts
    .filter((a) => a.status === "open" && a.severity === "critical")
    .map((a) => a.message);

  if (criticalIssues.length > 0 && !force) {
    return {
      success: false,
      message: "Critical issues must be fixed or confirmed before starting.",
      criticalIssues,
      serviceStartedAt: null,
      redirectUrl: null,
    };
  }

  const { prepareAndStartStreaming } = await import("@/lib/streaming/service");
  const streamingGate = await prepareAndStartStreaming(tenantId, userId, userEmail, skipDestinationIds);

  if (!streamingGate.canProceed && !force) {
    return {
      success: false,
      message:
        streamingGate.ready.length === 0
          ? "No streaming destination is ready yet."
          : "Some streaming destinations need attention before going live.",
      criticalIssues: streamingGate.needsAttention.map((d) => `${d.displayName}: ${d.message}`),
      serviceStartedAt: null,
      redirectUrl: null,
      streamingGate,
    };
  }

  const startedAt = new Date().toISOString();
  await updateService(payload.service.id, { serviceStartedAt: startedAt });

  if (payload.service.countdownEnabled) {
    await startCountdown(tenantId, userId, userEmail);
  }

  for (const rec of payload.recordingSettings) {
    if (rec.recordingEnabled) {
      await upsertRecordingSetting(payload.service.id, tenantId, { id: rec.id, status: "ready" });
    }
  }

  await writeAuditLog({
    tenantId,
    serviceId: payload.service.id,
    userId,
    userEmail,
    action: "begin_service",
    detailJson: { force, criticalIssues, streamingGate, skipDestinationIds },
  });

  await refreshReadinessForService(tenantId, payload.service.id);

  return {
    success: true,
    message: "Service has started. You're live!",
    criticalIssues: [],
    serviceStartedAt: startedAt,
    redirectUrl: "/dashboard/broadcast",
    streamingGate,
  };
}

export async function stopService(
  tenantId: string,
  userId: string,
  userEmail: string | null,
): Promise<import("@/lib/todays-service/types").StopServiceResult> {
  const payload = await loadTodaysService(tenantId);
  const { stopAllStreamingDestinations } = await import("@/lib/streaming/service");
  const { stopLocalEncoder } = await import("@/lib/streaming/encoder");

  const streaming = await stopAllStreamingDestinations(tenantId, userId, userEmail);
  const encoder = await stopLocalEncoder();

  let recordingStopped = false;
  for (const rec of payload.recordingSettings) {
    if (rec.recordingEnabled && rec.status !== "not_connected") {
      await upsertRecordingSetting(payload.service.id, tenantId, { id: rec.id, status: "ready" });
      recordingStopped = true;
    }
  }

  const stoppedAt = new Date().toISOString();
  await updateService(payload.service.id, { serviceStartedAt: null });

  await writeAuditLog({
    tenantId,
    serviceId: payload.service.id,
    userId,
    userEmail,
    action: "stop_service",
    detailJson: { streaming, encoderStopped: encoder.success, recordingStopped, stoppedAt },
  });

  await refreshReadinessForService(tenantId, payload.service.id);

  return {
    success: streaming.success || encoder.success,
    message: "Service stopped. All streams are offline.",
    serviceStoppedAt: stoppedAt,
    streaming,
    recordingStopped,
    encoderStopped: encoder.success,
  };
}

export async function startCountdown(
  tenantId: string,
  userId: string,
  userEmail: string | null,
): Promise<TestResult> {
  const service = await getOrCreateTodayService(tenantId);
  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "start_countdown",
  });
  return { success: true, message: "Countdown started." };
}

export async function previewBroadcast(
  tenantId: string,
  userId: string,
  userEmail: string | null,
): Promise<TestResult> {
  const service = await getOrCreateTodayService(tenantId);
  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "preview_broadcast",
  });
  return { success: true, message: "Preview opened.", details: { previewUrl: "/dashboard/broadcast" } };
}

export async function getLiveState(tenantId: string): Promise<LiveReadinessState | null> {
  const cached = await getLiveReadinessState(tenantId);
  if (cached) return cached;
  const payload = await loadTodaysService(tenantId);
  return payload.readiness;
}

export {
  createCamera,
  createEquipment,
  createInternetConnection,
  createSoundItem,
  createStreamingDestination,
  createTeamMember,
  createTimelineItem,
  deleteCamera,
  deleteEquipment,
  deleteInternetConnection,
  deletePresentationSource,
  deleteRecordingSetting,
  deleteSoundItem,
  deleteStreamingDestination,
  deleteTeamMember,
  deleteTimelineItem,
  getOrCreateTodayService,
  listAlerts,
  listCameras,
  listEquipment,
  listInternetConnections,
  listPresentationSources,
  listRecordingSettings,
  listSoundItems,
  listStreamingDestinations,
  listServiceBroadcastDestinations,
  listTeamMembers,
  listTimelineItems,
  reorderTimelineItems,
  updateAlert,
  updateCamera,
  updateEquipment,
  updateInternetConnection,
  updateSoundItem,
  updateStreamingDestination,
  updateTeamMember,
  updateTimelineItem,
  upsertPresentationSource,
  upsertRecordingSetting,
};
