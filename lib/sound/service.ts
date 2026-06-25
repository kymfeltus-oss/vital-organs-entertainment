import {
  agentDiscoverSoundDevices,
  agentReadSoundLevels,
  agentTestSoundDevice,
  isSoundAgentConfigured,
} from "@/lib/sound/agent";
import { plainEnglishSoundError } from "@/lib/sound/errors";
import {
  extractBrowserDeviceId,
  isBrowserSoundDevice,
  soundItemToLevelsSnapshot,
} from "@/lib/sound/device-utils";
import {
  mapCategoryToDeviceType,
  mapDiscoveredConnectionType,
  mapPersistedConnectionType,
  mapTestToDeviceStatus,
  levelsToDbFields,
} from "@/lib/sound/schema-map";
import { publishSoundLiveUpdate } from "@/lib/sound/events";
import type {
  CreateSoundDeviceInput,
  DiscoveredSoundDevice,
  SoundDiscoverResult,
  SoundLevelsSnapshot,
  SoundTestResult,
  UpdateSoundDeviceInput,
} from "@/lib/sound/types";
import {
  createSoundItem,
  deleteSoundItem,
  getOrCreateTodayService,
  listMixers,
  listSoundItems,
  updateSoundItem,
  upsertMixer,
  writeAuditLog,
} from "@/lib/todays-service/repository";
import type { Mixer, SoundCategory, SoundItem } from "@/lib/todays-service/types";

async function broadcastSound(tenantId: string, serviceId: string): Promise<void> {
  const soundItems = await listSoundItems(serviceId);
  await publishSoundLiveUpdate({ tenantId, soundItems, at: new Date().toISOString() });
}

function deviceToDiscovered(item: SoundItem): DiscoveredSoundDevice {
  return {
    id: item.deviceId ?? item.id,
    label: item.deviceLabel ?? item.hardwareLabel ?? item.name,
    connectionType: mapPersistedConnectionType(item.connectionType),
    hardwareLabel: item.hardwareLabel,
    deviceIndex: item.deviceIndex,
    manufacturer: item.manufacturer,
    model: item.model,
    sampleRate: item.sampleRate,
    channels: item.channelCount,
    source: String(item.configJson.source ?? "saved"),
    browserDeviceId: extractBrowserDeviceId(item.deviceId),
    mixerType: item.mixerType,
    mixerIp: item.mixerIp,
  };
}

export async function discoverAllSoundDevices(clientDevices: DiscoveredSoundDevice[] = []): Promise<SoundDiscoverResult> {
  let agentDevices: DiscoveredSoundDevice[] = [];
  let agentAvailable = false;
  let message = "Scanning for audio devices…";

  if (isSoundAgentConfigured()) {
    try {
      const agent = await agentDiscoverSoundDevices();
      agentDevices = agent.devices;
      agentAvailable = agent.agentAvailable;
      message = agent.message;
    } catch (error) {
      message = plainEnglishSoundError(error);
    }
  } else {
    message = "Production audio agent unavailable — using browser microphone discovery only.";
  }

  const merged = new Map<string, DiscoveredSoundDevice>();
  for (const device of [...clientDevices, ...agentDevices]) {
    merged.set(device.id, device);
  }

  return {
    devices: Array.from(merged.values()),
    agentAvailable,
    message: merged.size ? message : clientDevices.length ? "Found browser audio inputs." : message,
  };
}

export async function testDiscoveredSoundDevice(
  device: DiscoveredSoundDevice,
  clientVerified = false,
): Promise<SoundTestResult> {
  if (device.source === "browser" && device.browserDeviceId) {
    if (!clientVerified) {
      return { success: false, message: "Confirm microphone access in your browser before saving." };
    }
    return {
      success: true,
      message: "Microphone is responding.",
      steps: [
        { label: "Device opened", ok: true },
        { label: "Signal detected", ok: true },
        { label: "Audio level", ok: true },
        { label: "No clipping", ok: true },
        { label: "Ready for Service", ok: true },
      ],
    };
  }

  if (!isSoundAgentConfigured()) {
    return {
      success: false,
      message: "Production audio agent unavailable. Start the Parable audio service on this computer.",
    };
  }

  try {
    return await agentTestSoundDevice(device);
  } catch (error) {
    return { success: false, message: plainEnglishSoundError(error) };
  }
}

export async function readSoundLevelsForDevice(
  device: DiscoveredSoundDevice,
): Promise<SoundLevelsSnapshot & { success: boolean; message?: string; clientMetering?: boolean }> {
  if (device.browserDeviceId) {
    return {
      success: false,
      inputLevel: 0,
      peak: 0,
      rms: 0,
      clipping: false,
      signalPresent: false,
      clientMetering: true,
      message: "Browser microphone levels must be read on the client.",
    };
  }
  if (!isSoundAgentConfigured()) {
    return {
      success: false,
      inputLevel: 0,
      peak: 0,
      rms: 0,
      clipping: false,
      signalPresent: false,
      message: "Production audio agent unavailable.",
    };
  }
  try {
    return await agentReadSoundLevels(device);
  } catch (error) {
    return {
      success: false,
      inputLevel: 0,
      peak: 0,
      rms: 0,
      clipping: false,
      signalPresent: false,
      message: plainEnglishSoundError(error),
    };
  }
}

export async function getSoundItemForTenant(id: string, tenantId: string): Promise<SoundItem | null> {
  const service = await getOrCreateTodayService(tenantId);
  const items = await listSoundItems(service.id);
  return items.find((item) => item.id === id) ?? null;
}

function mixerModelSlug(device: DiscoveredSoundDevice): string {
  const label = `${device.manufacturer ?? ""} ${device.model ?? ""} ${device.label}`.toLowerCase();
  if (label.includes("x32")) return "behringer_x32";
  if (label.includes("m32")) return "midas_m32";
  if (label.includes("allen") || label.includes("heath")) return "allen_heath";
  if (label.includes("yamaha")) return "yamaha";
  return "unknown";
}

export async function createSoundFromDiscovery(
  tenantId: string,
  userId: string,
  userEmail: string | null,
  input: CreateSoundDeviceInput,
  discovered: DiscoveredSoundDevice,
  clientVerified = false,
  clientTest?: SoundTestResult,
): Promise<SoundItem> {
  if (!input.discoveredDeviceId || input.discoveredDeviceId !== discovered.id) {
    throw new Error("Select a discovered audio device before saving.");
  }
  if (!input.name.trim()) {
    throw new Error("Name is required.");
  }

  const test = clientTest ?? (await testDiscoveredSoundDevice(discovered, clientVerified));
  if (!test.success) {
    throw new Error(test.message);
  }

  const service = await getOrCreateTodayService(tenantId);
  const now = new Date().toISOString();

  let mixer: Mixer | null = null;
  const isNetworkMixer =
    (discovered.connectionType === "ethernet_mixer" || discovered.connectionType === "network_mixer") &&
    discovered.mixerIp;
  if (isNetworkMixer) {
    const existing = await listMixers(service.id);
    mixer =
      existing[0] ??
      (await upsertMixer(service.id, tenantId, {
        name: discovered.label,
        mixerModel: mixerModelSlug(discovered),
        manufacturer: discovered.manufacturer,
        model: discovered.model,
        ipAddress: discovered.mixerIp,
        ethernetIpAddress: discovered.mixerIp,
        connectionType: "ethernet",
        connectionStatus: "connected",
        liveStatus: "connected",
        firmwareVersion: test.firmware ?? null,
        channelCount: test.channelCount ?? discovered.channels ?? null,
        sceneName: test.scene ?? null,
        healthJson: test.health ?? {},
        lastTestAt: now,
        lastSuccessfulTestAt: now,
        lastErrorMessage: null,
      }));
    if (existing[0]) {
      mixer = await upsertMixer(service.id, tenantId, {
        id: existing[0].id,
        name: existing[0].name,
        connectionStatus: "connected",
        liveStatus: "connected",
        ethernetIpAddress: discovered.mixerIp,
        firmwareVersion: test.firmware ?? existing[0].firmwareVersion,
        channelCount: test.channelCount ?? existing[0].channelCount,
        sceneName: test.scene ?? existing[0].sceneName,
        healthJson: test.health ?? existing[0].healthJson,
        lastTestAt: now,
        lastSuccessfulTestAt: now,
        lastErrorMessage: null,
      });
    }
  }

  const connectionType = mapDiscoveredConnectionType(discovered.connectionType);
  const deviceType = mapCategoryToDeviceType(input.category);
  const levelFields = levelsToDbFields(test.levels);
  const status = mapTestToDeviceStatus(test.success, levelFields.signalPresent);
  const displayName = input.name.trim();
  const settingsJson = {
    ...(input.settings ?? {}),
    source: discovered.source,
    mixerId: mixer?.id ?? null,
    testSteps: test.steps ?? [],
  };

  const item = await createSoundItem(service.id, tenantId, {
    category: input.category as SoundCategory,
    name: displayName,
    deviceName: displayName,
    deviceLabel: discovered.hardwareLabel ?? discovered.label,
    deviceType,
    connectionType,
    deviceId: discovered.browserDeviceId ? `browser://${discovered.browserDeviceId}` : discovered.id,
    hardwareLabel: discovered.hardwareLabel ?? discovered.label,
    deviceIndex: discovered.deviceIndex ?? null,
    manufacturer: discovered.manufacturer ?? null,
    model: discovered.model ?? null,
    sampleRate: test.sampleRate ?? discovered.sampleRate ?? null,
    channelCount: test.channels ?? discovered.channels ?? null,
    signalPresent: levelFields.signalPresent,
    peakLevel: levelFields.peakLevel,
    averageLevel: levelFields.averageLevel,
    clippingDetected: levelFields.clippingDetected,
    mixerType:
      discovered.mixerType ??
      (isNetworkMixer ? mixerModelSlug(discovered) : null),
    mixerIp: discovered.mixerIp ?? null,
    status,
    liveStatus: test.success ? "connected" : "needs_attention",
    lastTestedAt: now,
    lastTestAt: now,
    lastSuccessfulTestAt: test.success ? now : null,
    lastConnectedAt: test.success ? now : null,
    lastErrorMessage: test.success ? null : test.message,
    healthJson: test.health ?? {},
    levelsJson: levelFields.levelsJson,
    settingsJson,
    configJson: settingsJson,
  });

  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "sound_device_create",
    detailJson: { soundItemId: item.id, connectionType: item.connectionType, discoveredDeviceId: discovered.id },
  });

  await broadcastSound(tenantId, service.id);
  return item;
}

export async function updateSoundDeviceAccount(
  id: string,
  tenantId: string,
  userId: string,
  userEmail: string | null,
  input: UpdateSoundDeviceInput,
): Promise<SoundItem> {
  const service = await getOrCreateTodayService(tenantId);
  const item = await updateSoundItem(id, {
    name: input.name,
    deviceName: input.name,
    category: input.category as SoundCategory | undefined,
    deviceType: input.category ? mapCategoryToDeviceType(input.category) : undefined,
    settingsJson: input.settings ? { ...input.settings } : undefined,
    configJson: input.settings ? { ...input.settings } : undefined,
  });

  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "sound_device_update",
    detailJson: { soundItemId: id },
  });

  await broadcastSound(tenantId, service.id);
  return item;
}

export async function deleteSoundDeviceAccount(
  id: string,
  tenantId: string,
  userId: string,
  userEmail: string | null,
): Promise<void> {
  const service = await getOrCreateTodayService(tenantId);
  await deleteSoundItem(id);
  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "sound_device_delete",
    detailJson: { soundItemId: id },
  });
  await broadcastSound(tenantId, service.id);
}

export async function testSavedSoundDevice(
  id: string,
  tenantId: string,
  userId: string,
  userEmail: string | null,
  clientVerified = false,
): Promise<SoundTestResult> {
  const item = await getSoundItemForTenant(id, tenantId);
  if (!item) throw new Error("Sound device not found.");

  const service = await getOrCreateTodayService(tenantId);
  const discovered = deviceToDiscovered(item);
  await updateSoundItem(id, { liveStatus: "testing", status: "needs_attention" });

  const result = await testDiscoveredSoundDevice(discovered, clientVerified);
  const now = new Date().toISOString();
  const levelFields = levelsToDbFields(result.levels ?? item.levelsJson);

  await updateSoundItem(id, {
    status: mapTestToDeviceStatus(result.success, levelFields.signalPresent),
    liveStatus: result.success ? "connected" : "needs_attention",
    lastTestedAt: now,
    lastTestAt: now,
    lastSuccessfulTestAt: result.success ? now : item.lastSuccessfulTestAt,
    lastErrorMessage: result.success ? null : result.message,
    levelsJson: levelFields.levelsJson,
    signalPresent: levelFields.signalPresent,
    peakLevel: levelFields.peakLevel,
    averageLevel: levelFields.averageLevel,
    clippingDetected: levelFields.clippingDetected,
    healthJson: result.health ?? item.healthJson,
    sampleRate: result.sampleRate ?? item.sampleRate,
    channelCount: result.channels ?? item.channelCount,
    settingsJson: {
      ...item.settingsJson,
      testSteps: result.steps ?? [],
      guidance: result.guidance ?? null,
    },
    configJson: {
      ...item.configJson,
      testSteps: result.steps ?? [],
      guidance: result.guidance ?? null,
    },
  });

  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "sound_device_test",
    detailJson: { soundItemId: id, success: result.success },
  });

  await broadcastSound(tenantId, service.id);
  return result;
}

export async function reconnectSoundDevice(
  id: string,
  tenantId: string,
  userId: string,
  userEmail: string | null,
): Promise<SoundTestResult> {
  return testSavedSoundDevice(id, tenantId, userId, userEmail, false);
}

export async function connectSoundDevice(
  id: string,
  tenantId: string,
  userId: string,
  userEmail: string | null,
): Promise<SoundItem> {
  const item = await getSoundItemForTenant(id, tenantId);
  if (!item) throw new Error("Sound device not found.");
  const service = await getOrCreateTodayService(tenantId);
  const now = new Date().toISOString();
  const updated = await updateSoundItem(id, {
    status: "connected",
    liveStatus: "connected",
    lastConnectedAt: now,
    lastErrorMessage: null,
  });
  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "sound_device_connect",
    detailJson: { soundItemId: id },
  });
  await broadcastSound(tenantId, service.id);
  return updated;
}

export async function disconnectSoundDevice(
  id: string,
  tenantId: string,
  userId: string,
  userEmail: string | null,
): Promise<SoundItem> {
  const item = await getSoundItemForTenant(id, tenantId);
  if (!item) throw new Error("Sound device not found.");
  const service = await getOrCreateTodayService(tenantId);
  const updated = await updateSoundItem(id, {
    status: "not_connected",
    liveStatus: "offline",
    lastErrorMessage: null,
  });
  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "sound_device_disconnect",
    detailJson: { soundItemId: id },
  });
  await broadcastSound(tenantId, service.id);
  return updated;
}

export async function previewSoundDevice(id: string, tenantId: string): Promise<{
  success: boolean;
  message: string;
  previewMode: "browser" | "agent" | "none";
  deviceId?: string;
}> {
  const item = await getSoundItemForTenant(id, tenantId);
  if (!item) return { success: false, message: "Sound device not found.", previewMode: "none" };
  if (item.deviceId?.startsWith("browser://")) {
    return {
      success: true,
      message: "Opening microphone preview.",
      previewMode: "browser",
      deviceId: item.deviceId.replace("browser://", ""),
    };
  }
  if (!isSoundAgentConfigured()) {
    return { success: false, message: "Production audio agent unavailable.", previewMode: "none" };
  }
  return { success: true, message: "Listening through production agent.", previewMode: "agent" };
}

export async function readSavedSoundLevels(
  id: string,
  tenantId: string,
): Promise<SoundLevelsSnapshot & { success: boolean; message?: string; clientMetering?: boolean }> {
  const item = await getSoundItemForTenant(id, tenantId);
  if (!item) {
    return { success: false, inputLevel: 0, peak: 0, rms: 0, clipping: false, signalPresent: false, message: "Not found." };
  }

  if (isBrowserSoundDevice(item)) {
    // #region agent log
    fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
      body: JSON.stringify({
        sessionId: "675ed0",
        location: "service.ts:readSavedSoundLevels",
        message: "browser device — server returns clientMetering flag",
        data: { soundItemId: id },
        timestamp: Date.now(),
        hypothesisId: "H1-no-server-browser",
      }),
    }).catch(() => {});
    // #endregion
    return { ...soundItemToLevelsSnapshot(item), clientMetering: true };
  }

  const levels = await readSoundLevelsForDevice(deviceToDiscovered(item));
  if (levels.success) {
    const service = await getOrCreateTodayService(tenantId);
    const levelFields = levelsToDbFields(levels);
    await updateSoundItem(id, {
      levelsJson: levelFields.levelsJson,
      signalPresent: levelFields.signalPresent,
      peakLevel: levelFields.peakLevel,
      averageLevel: levelFields.averageLevel,
      clippingDetected: levelFields.clippingDetected,
    });
    await broadcastSound(tenantId, service.id);
  }
  return levels;
}
