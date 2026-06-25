import { DEFAULT_EVENT_ID } from "@/lib/live/countdown-config";
import { MIXER_DB_COLUMNS, MIXER_DB_TABLE, type MixerDbRow } from "@/lib/database/mixers";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type {
  Camera,
  InternetConnection,
  Microphone,
  Mixer,
  PresentationSource,
  RecordingSetting,
  ServiceAlert,
  ServiceEquipment,
  ServiceRecord,
  ServiceTimelineItem,
  SoundItem,
  StreamingDestination,
  TeamMember,
} from "@/lib/todays-service/types";
import { DEFAULT_TIMELINE_PARTS, DEFAULT_SERVICE_TENANT_ID } from "@/lib/todays-service/types";
import {
  buildBaseSoundItemInsertRow,
  buildCanonicalSoundItemInsertRow,
  isSoundItemSchemaInsertError,
  logSoundItemInsertFailure,
  settingsToSoundFields,
} from "@/lib/sound/sound-item-db";
import {
  assertStreamingLiveStatus,
  normalizeStreamingLiveStatus,
  STREAMING_LIVE_STATUS_DEFAULT,
} from "@/lib/streaming/live-status";
import {
  getStreamingDestinationsSchema,
  STREAMING_SETUP_PROFILE_DB_COLUMNS,
  STREAMING_VALIDATION_CHECKS_DB_COLUMNS,
  STREAMING_VALIDATION_DB_COLUMNS,
  STREAMING_WEBSITE_VALIDATION_DB_COLUMNS,
} from "@/lib/todays-service/streaming-schema";
import { streamingSchemaMigrationError } from "@/lib/todays-service/migration-errors";

export { DEFAULT_SERVICE_TENANT_ID };

function todayDateString(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

export async function getServiceByTenantAndDate(
  tenantId: string,
  serviceDate: string,
): Promise<ServiceRecord | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("services")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("service_date", serviceDate)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapServiceRow(data) : null;
}

export async function getOrCreateTodayService(tenantId = DEFAULT_SERVICE_TENANT_ID): Promise<ServiceRecord> {
  const admin = getSupabaseAdmin();
  const serviceDate = todayDateString();

  const { data: existing, error: selectError } = await admin
    .from("services")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("service_date", serviceDate)
    .maybeSingle();

  if (selectError) throw new Error(selectError.message);

  if (existing) {
    return mapServiceRow(existing);
  }

  const { data: created, error } = await admin
    .from("services")
    .insert({
      tenant_id: tenantId,
      service_name: "Today's Service",
      service_date: serviceDate,
      service_start_time: "10:00:00",
      broadcast_profile: "Standard",
      readiness_message: "Getting everything ready for church today.",
    })
    .select("*")
    .single();

  if (error || !created) {
    if (error?.message?.includes("services_tenant_date_unique")) {
      const existingAfterRace = await getServiceByTenantAndDate(tenantId, serviceDate);
      if (existingAfterRace) return existingAfterRace;
    }
    throw new Error(error?.message ?? "Unable to create service.");
  }

  await seedDefaultTimeline(created.id, tenantId);
  return mapServiceRow(created);
}

export async function getServiceById(serviceId: string, tenantId = DEFAULT_SERVICE_TENANT_ID): Promise<ServiceRecord> {
  const { data, error } = await getSupabaseAdmin()
    .from("services")
    .select("*")
    .eq("id", serviceId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Service not found.");

  return mapServiceRow(data);
}

async function seedDefaultTimeline(serviceId: string, tenantId: string) {
  const admin = getSupabaseAdmin();
  const rows = DEFAULT_TIMELINE_PARTS.map((part, index) => ({
    tenant_id: tenantId,
    service_id: serviceId,
    part_key: part.partKey,
    label: part.label,
    sort_order: index,
  }));
  await admin.from("service_timeline_items").insert(rows);
}

function mapServiceRow(row: Record<string, unknown>): ServiceRecord {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    serviceName: String(row.service_name),
    serviceDate: String(row.service_date),
    serviceStartTime: String(row.service_start_time).slice(0, 5),
    broadcastProfile: String(row.broadcast_profile),
    readinessMessage: String(row.readiness_message),
    countdownEnabled: Boolean(row.countdown_enabled),
    serviceStartedAt: row.service_started_at ? String(row.service_started_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function updateService(
  serviceId: string,
  patch: Partial<{
    serviceName: string;
    serviceDate: string;
    serviceStartTime: string;
    broadcastProfile: string;
    readinessMessage: string;
    countdownEnabled: boolean;
    serviceStartedAt: string | null;
  }>,
  tenantId = DEFAULT_SERVICE_TENANT_ID,
): Promise<ServiceRecord> {
  const admin = getSupabaseAdmin();

  if (patch.serviceDate !== undefined) {
    const conflict = await getServiceByTenantAndDate(tenantId, patch.serviceDate);
    if (conflict && conflict.id !== serviceId) {
      throw new Error(
        "A service already exists for that date. Refresh the page to load today's service, or choose a different date.",
      );
    }
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.serviceName !== undefined) update.service_name = patch.serviceName;
  if (patch.serviceDate !== undefined) update.service_date = patch.serviceDate;
  if (patch.serviceStartTime !== undefined) update.service_start_time = patch.serviceStartTime;
  if (patch.broadcastProfile !== undefined) update.broadcast_profile = patch.broadcastProfile;
  if (patch.readinessMessage !== undefined) update.readiness_message = patch.readinessMessage;
  if (patch.countdownEnabled !== undefined) update.countdown_enabled = patch.countdownEnabled;
  if (patch.serviceStartedAt !== undefined) update.service_started_at = patch.serviceStartedAt;

  const { data, error } = await admin.from("services").update(update).eq("id", serviceId).select("*").single();
  if (error || !data) {
    throw new Error(error?.message ?? "Unable to update service.");
  }
  return mapServiceRow(data);
}

export async function listEquipment(serviceId: string): Promise<ServiceEquipment[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("service_equipment")
    .select("*")
    .eq("service_id", serviceId)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapEquipmentRow);
}

function mapEquipmentRow(row: Record<string, unknown>): ServiceEquipment {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    serviceId: String(row.service_id),
    equipmentType: String(row.equipment_type),
    name: String(row.name),
    configJson: (row.config_json as Record<string, unknown>) ?? {},
    status: row.status as ServiceEquipment["status"],
    sortOrder: Number(row.sort_order),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function createEquipment(
  serviceId: string,
  tenantId: string,
  input: { equipmentType: string; name: string; configJson?: Record<string, unknown>; status?: string },
): Promise<ServiceEquipment> {
  const { data, error } = await getSupabaseAdmin()
    .from("service_equipment")
    .insert({
      tenant_id: tenantId,
      service_id: serviceId,
      equipment_type: input.equipmentType,
      name: input.name,
      config_json: input.configJson ?? {},
      status: input.status ?? "unknown",
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to add equipment.");
  return mapEquipmentRow(data);
}

export async function updateEquipment(
  id: string,
  patch: Partial<{ name: string; configJson: Record<string, unknown>; status: string }>,
): Promise<ServiceEquipment> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.configJson !== undefined) update.config_json = patch.configJson;
  if (patch.status !== undefined) update.status = patch.status;

  const { data, error } = await getSupabaseAdmin()
    .from("service_equipment")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to update equipment.");
  return mapEquipmentRow(data);
}

export async function deleteEquipment(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from("service_equipment").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listSoundItems(serviceId: string): Promise<SoundItem[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("sound_items")
    .select("*")
    .eq("service_id", serviceId)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapSoundRow);
}

function mapSoundRow(row: Record<string, unknown>): SoundItem {
  const deviceName = String(row.device_name ?? row.name ?? "");
  const lastTestedAt = row.last_tested_at
    ? String(row.last_tested_at)
    : row.last_test_at
      ? String(row.last_test_at)
      : null;
  const settingsJson = (row.settings_json as Record<string, unknown>) ?? (row.config_json as Record<string, unknown>) ?? {};
  const fromSettings = settingsToSoundFields(settingsJson);
  const levelsJson =
    (row.levels_json as Record<string, unknown>) ??
    (fromSettings.levelsJson as Record<string, unknown>) ??
    ((settingsJson.levels as Record<string, unknown>) ?? {});
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    serviceId: String(row.service_id),
    category: row.category as SoundItem["category"],
    name: deviceName,
    deviceName,
    deviceLabel:
      row.device_label != null
        ? String(row.device_label)
        : fromSettings.hardwareLabel ?? (row.hardware_label != null ? String(row.hardware_label) : null),
    deviceType: (row.device_type as SoundItem["deviceType"]) ?? fromSettings.deviceType ?? "microphone",
    connectionType:
      (row.connection_type as SoundItem["connectionType"]) ?? fromSettings.connectionType ?? "unknown",
    deviceId:
      row.device_id != null ? String(row.device_id) : fromSettings.deviceId ?? null,
    hardwareLabel:
      row.hardware_label != null
        ? String(row.hardware_label)
        : fromSettings.hardwareLabel ?? null,
    deviceIndex:
      row.device_index != null ? Number(row.device_index) : (fromSettings.deviceIndex ?? null),
    manufacturer: row.manufacturer != null ? String(row.manufacturer) : null,
    model: row.model != null ? String(row.model) : (fromSettings.model ?? null),
    sampleRate:
      row.sample_rate != null ? Number(row.sample_rate) : (fromSettings.sampleRate ?? null),
    channelCount:
      row.channel_count != null ? Number(row.channel_count) : (fromSettings.channelCount ?? null),
    signalPresent: Boolean(
      row.signal_present ?? fromSettings.signalPresent ?? levelsJson.signalPresent ?? false,
    ),
    peakLevel:
      row.peak_level != null
        ? Number(row.peak_level)
        : (fromSettings.peakLevel ?? (typeof levelsJson.peak === "number" ? levelsJson.peak : null)),
    averageLevel:
      row.average_level != null
        ? Number(row.average_level)
        : (fromSettings.averageLevel ?? (typeof levelsJson.rms === "number" ? levelsJson.rms : null)),
    clippingDetected: Boolean(
      row.clipping_detected ?? fromSettings.clippingDetected ?? levelsJson.clipping ?? false,
    ),
    mixerType: row.mixer_type != null ? String(row.mixer_type) : (fromSettings.mixerType ?? null),
    mixerIp: row.mixer_ip != null ? String(row.mixer_ip) : (fromSettings.mixerIp ?? null),
    lastTestedAt: lastTestedAt ?? fromSettings.lastTestedAt ?? null,
    lastTestAt: lastTestedAt ?? fromSettings.lastTestedAt ?? null,
    lastSuccessfulTestAt:
      row.last_successful_test_at
        ? String(row.last_successful_test_at)
        : (fromSettings.lastSuccessfulTestAt ?? null),
    lastConnectedAt:
      row.last_connected_at != null
        ? String(row.last_connected_at)
        : (fromSettings.lastConnectedAt ?? null),
    lastErrorMessage: row.last_error_message != null ? String(row.last_error_message) : null,
    liveStatus:
      (row.live_status as SoundItem["liveStatus"]) ?? fromSettings.liveStatus ?? "offline",
    healthJson: (row.health_json as Record<string, unknown>) ?? fromSettings.healthJson ?? {},
    levelsJson,
    settingsJson,
    configJson: settingsJson,
    status: (row.status as SoundItem["status"]) ?? "not_connected",
    sortOrder: Number(row.sort_order),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function createSoundItem(
  serviceId: string,
  tenantId: string,
  input: Partial<SoundItem> & { category: string; name: string },
): Promise<SoundItem> {
  if (!serviceId?.trim()) {
    throw new Error("service_id is required to save a sound device.");
  }
  if (!tenantId?.trim()) {
    throw new Error("tenant_id is required to save a sound device.");
  }

  const admin = getSupabaseAdmin();
  const canonicalRow = buildCanonicalSoundItemInsertRow(serviceId, tenantId, input);

  let insertAttempt: "canonical" | "base" = "canonical";
  let { data, error } = await admin.from("sound_items").insert(canonicalRow).select("*").single();

  if (error) {
    logSoundItemInsertFailure(error, canonicalRow, tenantId, serviceId, "canonical");
    // #region agent log
    fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
      body: JSON.stringify({
        sessionId: "675ed0",
        location: "repository.ts:createSoundItem",
        message: "canonical insert failed",
        data: { code: error.code, insertKeys: Object.keys(canonicalRow), attempt: "canonical" },
        timestamp: Date.now(),
        hypothesisId: "H1-canonical-insert",
      }),
    }).catch(() => {});
    // #endregion

    if (isSoundItemSchemaInsertError(error)) {
      const baseRow = buildBaseSoundItemInsertRow(serviceId, tenantId, input);
      insertAttempt = "base";
      const retry = await admin.from("sound_items").insert(baseRow).select("*").single();
      if (retry.error) {
        logSoundItemInsertFailure(retry.error, baseRow, tenantId, serviceId, "base");
        // #region agent log
        fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
          body: JSON.stringify({
            sessionId: "675ed0",
            location: "repository.ts:createSoundItem",
            message: "base insert failed",
            data: { code: retry.error.code, insertKeys: Object.keys(baseRow), attempt: "base" },
            timestamp: Date.now(),
            hypothesisId: "H2-base-insert",
          }),
        }).catch(() => {});
        // #endregion
        throw new Error(retry.error.message ?? "Unable to add sound item.");
      }
      data = retry.data;
    } else {
      throw new Error(error.message ?? "Unable to add sound item.");
    }
  }

  if (!data) throw new Error("Unable to add sound item.");

  console.info("[SOUND_ITEM_INSERT_OK]", {
    attempt: insertAttempt,
    sound_item_id: (data as Record<string, unknown>).id,
    tenant_id: tenantId,
    service_id: serviceId,
  });

  // #region agent log
  fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
    body: JSON.stringify({
      sessionId: "675ed0",
      location: "repository.ts:createSoundItem",
      message: "insert succeeded",
      data: { attempt: insertAttempt, soundItemId: String((data as Record<string, unknown>).id) },
      timestamp: Date.now(),
      hypothesisId: "H3-insert-ok",
    }),
  }).catch(() => {});
  // #endregion

  return mapSoundRow(data);
}

function soundItemUpdateRow(patch: Partial<SoundItem>): Record<string, unknown> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.category !== undefined) update.category = patch.category;
  if (patch.name !== undefined) {
    update.name = patch.name;
    update.device_name = patch.deviceName ?? patch.name;
  }
  if (patch.deviceName !== undefined) {
    update.device_name = patch.deviceName;
    update.name = patch.deviceName;
  }
  if (patch.deviceLabel !== undefined) update.device_label = patch.deviceLabel;
  if (patch.deviceType !== undefined) update.device_type = patch.deviceType;
  if (patch.connectionType !== undefined) update.connection_type = patch.connectionType;
  if (patch.deviceId !== undefined) update.device_id = patch.deviceId;
  if (patch.manufacturer !== undefined) update.manufacturer = patch.manufacturer;
  if (patch.sampleRate !== undefined) update.sample_rate = patch.sampleRate;
  if (patch.channelCount !== undefined) update.channel_count = patch.channelCount;
  if (patch.signalPresent !== undefined) update.signal_present = patch.signalPresent;
  if (patch.peakLevel !== undefined) update.peak_level = patch.peakLevel;
  if (patch.averageLevel !== undefined) update.average_level = patch.averageLevel;
  if (patch.clippingDetected !== undefined) update.clipping_detected = patch.clippingDetected;
  if (patch.lastTestedAt !== undefined) update.last_tested_at = patch.lastTestedAt;
  if (patch.lastTestAt !== undefined) update.last_tested_at = patch.lastTestAt;
  if (patch.lastConnectedAt !== undefined) update.last_connected_at = patch.lastConnectedAt;
  if (patch.lastErrorMessage !== undefined) update.last_error_message = patch.lastErrorMessage;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.sortOrder !== undefined) update.sort_order = patch.sortOrder;

  if (
    patch.settingsJson !== undefined ||
    patch.configJson !== undefined ||
    patch.liveStatus !== undefined ||
    patch.levelsJson !== undefined ||
    patch.healthJson !== undefined ||
    patch.mixerType !== undefined ||
    patch.mixerIp !== undefined ||
    patch.deviceIndex !== undefined ||
    patch.hardwareLabel !== undefined ||
    patch.model !== undefined ||
    patch.lastSuccessfulTestAt !== undefined
  ) {
    const settings = {
      ...(patch.settingsJson ?? patch.configJson ?? {}),
      ...(patch.liveStatus !== undefined ? { liveStatus: patch.liveStatus } : {}),
      ...(patch.levelsJson !== undefined ? { levels: patch.levelsJson } : {}),
      ...(patch.healthJson !== undefined ? { health: patch.healthJson } : {}),
      ...(patch.mixerType !== undefined ? { mixerType: patch.mixerType } : {}),
      ...(patch.mixerIp !== undefined ? { mixerIp: patch.mixerIp } : {}),
      ...(patch.deviceIndex !== undefined ? { deviceIndex: patch.deviceIndex } : {}),
      ...(patch.hardwareLabel !== undefined ? { hardwareLabel: patch.hardwareLabel } : {}),
      ...(patch.model !== undefined ? { model: patch.model } : {}),
      ...(patch.lastSuccessfulTestAt !== undefined
        ? { lastSuccessfulTestAt: patch.lastSuccessfulTestAt }
        : {}),
    };
    update.settings_json = settings;
    update.config_json = settings;
  }

  return update;
}

export async function updateSoundItem(
  id: string,
  patch: Partial<SoundItem>,
): Promise<SoundItem> {
  const update = soundItemUpdateRow(patch);

  const { data, error } = await getSupabaseAdmin().from("sound_items").update(update).eq("id", id).select("*").single();
  if (error || !data) throw new Error(error?.message ?? "Unable to update sound item.");
  return mapSoundRow(data);
}

export async function deleteSoundItem(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from("sound_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listMixers(serviceId: string): Promise<Mixer[]> {
  const { data, error } = await getSupabaseAdmin().from(MIXER_DB_TABLE).select("*").eq(MIXER_DB_COLUMNS.serviceId, serviceId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapMixerRow);
}

function mapMixerRow(row: Record<string, unknown>): Mixer {
  const c = MIXER_DB_COLUMNS;
  const ethernetIp = row[c.ethernetIpAddress] != null ? String(row[c.ethernetIpAddress]) : null;
  const legacyIp = String(row[c.ipAddress] ?? "");
  const firmwareVersion =
    row[c.firmwareVersion] != null
      ? String(row[c.firmwareVersion])
      : row.firmware != null
        ? String(row.firmware)
        : null;
  return {
    id: String(row[c.id]),
    tenantId: String(row[c.tenantId]),
    serviceId: String(row[c.serviceId]),
    soundItemId: row[c.soundItemId] ? String(row[c.soundItemId]) : null,
    name: String(row[c.name]),
    mixerModel: String(row[c.mixerModel] ?? ""),
    manufacturer: row[c.manufacturer] != null ? String(row[c.manufacturer]) : null,
    model: row[c.model] != null ? String(row[c.model]) : null,
    ipAddress: ethernetIp || legacyIp,
    ethernetIpAddress: ethernetIp,
    connectionType: (row[c.connectionType] as Mixer["connectionType"]) ?? "unknown",
    usbDeviceName: row[c.usbDeviceName] != null ? String(row[c.usbDeviceName]) : null,
    usbDeviceId: row[c.usbDeviceId] != null ? String(row[c.usbDeviceId]) : null,
    lastConnectionMethod: row[c.lastConnectionMethod] != null ? String(row[c.lastConnectionMethod]) : null,
    firmware: firmwareVersion,
    firmwareVersion,
    serialNumber: row[c.serialNumber] != null ? String(row[c.serialNumber]) : null,
    connectionStatus: row[c.connectionStatus] as Mixer["connectionStatus"],
    lastConnectedAt: row[c.lastConnectedAt] ? String(row[c.lastConnectedAt]) : null,
    lastTestAt: row.last_test_at ? String(row.last_test_at) : null,
    lastSuccessfulTestAt: row.last_successful_test_at ? String(row.last_successful_test_at) : null,
    lastErrorMessage: row.last_error_message != null ? String(row.last_error_message) : null,
    liveStatus: (row.live_status as Mixer["liveStatus"]) ?? "offline",
    healthJson: (row.health_json as Record<string, unknown>) ?? {},
    sceneName: row.scene_name != null ? String(row.scene_name) : null,
    channelCount: row.channel_count != null ? Number(row.channel_count) : null,
    sampleRate: row.sample_rate != null ? Number(row.sample_rate) : null,
    importedSetupJson:
      row[c.importedSetupJson] != null
        ? (row[c.importedSetupJson] as Record<string, unknown>)
        : null,
    connectionConfigJson: (row[c.connectionConfigJson] as Record<string, unknown>) ?? {},
    createdAt: String(row[c.createdAt]),
    updatedAt: String(row[c.updatedAt]),
  };
}

function mixerFirmwareColumn(input: Partial<Mixer>): string | null {
  const value = input.firmwareVersion ?? input.firmware ?? null;
  return value != null && value !== "" ? value : null;
}

function mixerInsertRow(
  serviceId: string,
  tenantId: string,
  input: Partial<Mixer> & { name: string },
): Record<string, unknown> {
  const c = MIXER_DB_COLUMNS;
  return {
    [c.tenantId]: tenantId,
    [c.serviceId]: serviceId,
    [c.name]: input.name,
    [c.ipAddress]: input.ethernetIpAddress ?? input.ipAddress ?? "",
    [c.ethernetIpAddress]: input.ethernetIpAddress ?? input.ipAddress ?? null,
    [c.mixerModel]: input.mixerModel ?? "behringer_x32",
    [c.manufacturer]: input.manufacturer ?? null,
    [c.model]: input.model ?? null,
    [c.firmwareVersion]: mixerFirmwareColumn(input),
    [c.serialNumber]: input.serialNumber ?? null,
    [c.connectionType]: input.connectionType ?? "unknown",
    [c.usbDeviceName]: input.usbDeviceName ?? null,
    [c.usbDeviceId]: input.usbDeviceId ?? null,
    [c.lastConnectionMethod]: input.lastConnectionMethod ?? null,
    [c.connectionStatus]: input.connectionStatus ?? "not_connected",
    [c.lastConnectedAt]: input.lastConnectedAt ?? null,
    last_test_at: input.lastTestAt ?? null,
    last_successful_test_at: input.lastSuccessfulTestAt ?? null,
    last_error_message: input.lastErrorMessage ?? null,
    live_status: input.liveStatus ?? "offline",
    health_json: input.healthJson ?? {},
    scene_name: input.sceneName ?? null,
    channel_count: input.channelCount ?? null,
    sample_rate: input.sampleRate ?? null,
    [c.soundItemId]: input.soundItemId ?? null,
    [c.importedSetupJson]: input.importedSetupJson ?? null,
    [c.connectionConfigJson]: input.connectionConfigJson ?? {},
  };
}

export async function upsertMixer(
  serviceId: string,
  tenantId: string,
  input: Partial<Mixer> & { name: string },
): Promise<Mixer> {
  const admin = getSupabaseAdmin();
  if (input.id) {
    const c = MIXER_DB_COLUMNS;
    const update: Record<string, unknown> = { [c.updatedAt]: new Date().toISOString() };
    if (input.name !== undefined) update[c.name] = input.name;
    if (input.ipAddress !== undefined) {
      update[c.ipAddress] = input.ipAddress;
      update[c.ethernetIpAddress] = input.ipAddress;
    }
    if (input.ethernetIpAddress !== undefined) {
      update[c.ethernetIpAddress] = input.ethernetIpAddress;
      update[c.ipAddress] = input.ethernetIpAddress;
    }
    if (input.connectionType !== undefined) update[c.connectionType] = input.connectionType;
    if (input.usbDeviceName !== undefined) update[c.usbDeviceName] = input.usbDeviceName;
    if (input.usbDeviceId !== undefined) update[c.usbDeviceId] = input.usbDeviceId;
    if (input.lastConnectionMethod !== undefined) update[c.lastConnectionMethod] = input.lastConnectionMethod;
    if (input.mixerModel !== undefined) update[c.mixerModel] = input.mixerModel;
    if (input.manufacturer !== undefined) update[c.manufacturer] = input.manufacturer;
    if (input.model !== undefined) update[c.model] = input.model;
    if (input.firmware !== undefined || input.firmwareVersion !== undefined) {
      update[c.firmwareVersion] = mixerFirmwareColumn(input);
    }
    if (input.serialNumber !== undefined) update[c.serialNumber] = input.serialNumber;
    if (input.connectionStatus !== undefined) update[c.connectionStatus] = input.connectionStatus;
    if (input.lastConnectedAt !== undefined) update[c.lastConnectedAt] = input.lastConnectedAt;
    if (input.lastTestAt !== undefined) update.last_test_at = input.lastTestAt;
    if (input.lastSuccessfulTestAt !== undefined) update.last_successful_test_at = input.lastSuccessfulTestAt;
    if (input.lastErrorMessage !== undefined) update.last_error_message = input.lastErrorMessage;
    if (input.liveStatus !== undefined) update.live_status = input.liveStatus;
    if (input.healthJson !== undefined) update.health_json = input.healthJson;
    if (input.sceneName !== undefined) update.scene_name = input.sceneName;
    if (input.channelCount !== undefined) update.channel_count = input.channelCount;
    if (input.sampleRate !== undefined) update.sample_rate = input.sampleRate;
    if (input.soundItemId !== undefined) update[c.soundItemId] = input.soundItemId;
    if (input.importedSetupJson !== undefined) update[c.importedSetupJson] = input.importedSetupJson;
    if (input.connectionConfigJson !== undefined) update[c.connectionConfigJson] = input.connectionConfigJson;

    const { data, error } = await admin.from(MIXER_DB_TABLE).update(update).eq("id", input.id).select("*").single();
    if (error || !data) {
      throwMixerPersistenceError(error?.message ?? "Unable to update mixer.");
    }
    return mapMixerRow(data);
  }

  const { data, error } = await admin
    .from(MIXER_DB_TABLE)
    .insert(mixerInsertRow(serviceId, tenantId, input))
    .select("*")
    .single();
  if (error || !data) {
    throwMixerPersistenceError(error?.message ?? "Unable to save mixer.");
  }
  return mapMixerRow(data);
}

function throwMixerPersistenceError(message: string): never {
  if (message.includes("schema cache") || message.includes("Could not find")) {
    throw new Error(
      `${message} Run supabase/migrations/20260630120000_mixers_schema_sync.sql against your database, then refresh the schema cache.`,
    );
  }
  throw new Error(message);
}

export async function getMixerById(serviceId: string, mixerId: string): Promise<Mixer | null> {
  const { data, error } = await getSupabaseAdmin()
    .from(MIXER_DB_TABLE)
    .select("*")
    .eq(MIXER_DB_COLUMNS.serviceId, serviceId)
    .eq(MIXER_DB_COLUMNS.id, mixerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapMixerRow(data) : null;
}

function mapTenantEquipmentProfileRow(row: Record<string, unknown>) {
  const onboarding = (row.onboarding_json as Record<string, unknown>) ?? {};
  const preferredNetworkRaw = row.preferred_network_json as Record<string, unknown> | null | undefined;
  const preferredNetwork =
    preferredNetworkRaw && preferredNetworkRaw.type
      ? {
          type: String(preferredNetworkRaw.type) as import("@/lib/internet/types").InternetConnectionType,
          ssid: preferredNetworkRaw.ssid != null ? String(preferredNetworkRaw.ssid) : null,
          remember: preferredNetworkRaw.remember !== false,
        }
      : null;
  return {
    tenantId: String(row.tenant_id),
    preferredConnectionType:
      row.preferred_connection_type != null
        ? (String(row.preferred_connection_type) as import("@/lib/todays-service/mixer-connection").MixerConnectionTypeChoice)
        : null,
    rememberConnectionChoice: row.remember_connection_choice !== false,
    preferredNetwork,
    recommendedBroadcastPlatform:
      (row.recommended_broadcast_platform as import("@/lib/streaming/types").StreamingPlatform) ?? "youtube",
    onboarding: {
      currentSection:
        (onboarding.currentSection as import("@/lib/todays-service/equipment-onboarding").EquipmentOnboardingSectionId) ??
        "mixer",
      mixerWizardStep: typeof onboarding.mixerWizardStep === "number" ? onboarding.mixerWizardStep : 1,
      completedSections:
        (onboarding.completedSections as import("@/lib/todays-service/equipment-onboarding").EquipmentOnboardingSectionId[]) ??
        [],
    },
    updatedAt: String(row.updated_at),
  };
}

export async function getTenantEquipmentProfile(
  tenantId: string,
): Promise<ReturnType<typeof mapTenantEquipmentProfileRow> | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("tenant_equipment_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) {
    if (error.message.includes("tenant_equipment_profiles") && error.message.includes("schema cache")) {
      return null;
    }
    throw new Error(error.message);
  }
  return data ? mapTenantEquipmentProfileRow(data) : null;
}

export async function upsertTenantEquipmentProfile(
  tenantId: string,
  patch: Partial<{
    preferredConnectionType: string | null;
    rememberConnectionChoice: boolean;
    preferredNetwork: import("@/lib/internet/types").PreferredChurchNetwork | null;
    onboarding: Record<string, unknown>;
  }>,
): Promise<ReturnType<typeof mapTenantEquipmentProfileRow>> {
  const admin = getSupabaseAdmin();
  const existing = await getTenantEquipmentProfile(tenantId);
  const row = {
    tenant_id: tenantId,
    preferred_connection_type:
      patch.preferredConnectionType !== undefined
        ? patch.preferredConnectionType
        : existing?.preferredConnectionType ?? null,
    remember_connection_choice:
      patch.rememberConnectionChoice !== undefined
        ? patch.rememberConnectionChoice
        : existing?.rememberConnectionChoice ?? true,
    preferred_network_json:
      patch.preferredNetwork !== undefined
        ? patch.preferredNetwork
        : existing?.preferredNetwork ?? {},
    onboarding_json: {
      ...(existing?.onboarding ?? { currentSection: "mixer", mixerWizardStep: 1, completedSections: [] }),
      ...(patch.onboarding ?? {}),
    },
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await admin
    .from("tenant_equipment_profiles")
    .upsert(row, { onConflict: "tenant_id" })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to save equipment profile.");
  return mapTenantEquipmentProfileRow(data);
}

export async function getLastConnectedMixer(tenantId: string): Promise<Mixer | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("mixers")
    .select("*")
    .eq("tenant_id", tenantId)
    .not("last_connected_at", "is", null)
    .order("last_connected_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapMixerRow(data) : null;
}

export async function listMicrophones(serviceId: string): Promise<Microphone[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("microphones")
    .select("*")
    .eq("service_id", serviceId)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapMicRow);
}

function mapMicRow(row: Record<string, unknown>): Microphone {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    serviceId: String(row.service_id),
    soundItemId: row.sound_item_id ? String(row.sound_item_id) : null,
    name: String(row.name),
    micType: String(row.mic_type),
    batteryPct: row.battery_pct != null ? Number(row.battery_pct) : null,
    status: row.status as Microphone["status"],
    sortOrder: Number(row.sort_order),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listCameras(serviceId: string): Promise<Camera[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("cameras")
    .select("*")
    .eq("service_id", serviceId)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCameraRow);
}

function mapCameraRow(row: Record<string, unknown>): Camera {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    serviceId: String(row.service_id),
    name: String(row.name),
    cameraType: String(row.camera_type),
    location: String(row.location),
    previewSource: String(row.preview_source),
    connectionType: (row.connection_type as Camera["connectionType"]) ?? "usb",
    deviceId: row.device_id != null ? String(row.device_id) : null,
    hardwareLabel: row.hardware_label != null ? String(row.hardware_label) : null,
    deviceIndex: row.device_index != null ? Number(row.device_index) : null,
    networkUrl: row.network_url != null ? String(row.network_url) : null,
    networkUsername: row.network_username != null ? String(row.network_username) : null,
    manufacturer: row.manufacturer != null ? String(row.manufacturer) : null,
    model: row.model != null ? String(row.model) : null,
    lastTestAt: row.last_test_at ? String(row.last_test_at) : null,
    lastSuccessfulTestAt: row.last_successful_test_at ? String(row.last_successful_test_at) : null,
    lastErrorMessage: row.last_error_message != null ? String(row.last_error_message) : null,
    liveStatus: (row.live_status as Camera["liveStatus"]) ?? "offline",
    settingsJson: (row.settings_json as Record<string, unknown>) ?? {},
    status: row.status as Camera["status"],
    sortOrder: Number(row.sort_order),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function createCamera(
  serviceId: string,
  tenantId: string,
  input: Partial<Camera> & {
    name: string;
    networkPasswordEncrypted?: string | null;
  },
): Promise<Camera> {
  const { data, error } = await getSupabaseAdmin()
    .from("cameras")
    .insert({
      tenant_id: tenantId,
      service_id: serviceId,
      name: input.name,
      camera_type: input.cameraType ?? "fixed",
      location: input.location ?? "",
      preview_source: input.previewSource ?? "",
      connection_type: input.connectionType ?? "usb",
      device_id: input.deviceId ?? null,
      hardware_label: input.hardwareLabel ?? null,
      device_index: input.deviceIndex ?? null,
      network_url: input.networkUrl ?? null,
      network_username: input.networkUsername ?? null,
      network_password_encrypted: input.networkPasswordEncrypted ?? null,
      manufacturer: input.manufacturer ?? null,
      model: input.model ?? null,
      last_test_at: input.lastTestAt ?? null,
      last_successful_test_at: input.lastSuccessfulTestAt ?? null,
      last_error_message: input.lastErrorMessage ?? null,
      live_status: input.liveStatus ?? "offline",
      settings_json: input.settingsJson ?? {},
      status: input.status ?? "unknown",
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to add camera.");
  return mapCameraRow(data);
}

export async function updateCamera(
  id: string,
  patch: Partial<Camera> & { networkPasswordEncrypted?: string | null },
): Promise<Camera> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.cameraType !== undefined) update.camera_type = patch.cameraType;
  if (patch.location !== undefined) update.location = patch.location;
  if (patch.previewSource !== undefined) update.preview_source = patch.previewSource;
  if (patch.connectionType !== undefined) update.connection_type = patch.connectionType;
  if (patch.deviceId !== undefined) update.device_id = patch.deviceId;
  if (patch.hardwareLabel !== undefined) update.hardware_label = patch.hardwareLabel;
  if (patch.deviceIndex !== undefined) update.device_index = patch.deviceIndex;
  if (patch.networkUrl !== undefined) update.network_url = patch.networkUrl;
  if (patch.networkUsername !== undefined) update.network_username = patch.networkUsername;
  if (patch.networkPasswordEncrypted !== undefined) update.network_password_encrypted = patch.networkPasswordEncrypted;
  if (patch.manufacturer !== undefined) update.manufacturer = patch.manufacturer;
  if (patch.model !== undefined) update.model = patch.model;
  if (patch.lastTestAt !== undefined) update.last_test_at = patch.lastTestAt;
  if (patch.lastSuccessfulTestAt !== undefined) update.last_successful_test_at = patch.lastSuccessfulTestAt;
  if (patch.lastErrorMessage !== undefined) update.last_error_message = patch.lastErrorMessage;
  if (patch.liveStatus !== undefined) update.live_status = patch.liveStatus;
  if (patch.settingsJson !== undefined) update.settings_json = patch.settingsJson;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.sortOrder !== undefined) update.sort_order = patch.sortOrder;

  const { data, error } = await getSupabaseAdmin().from("cameras").update(update).eq("id", id).select("*").single();
  if (error || !data) throw new Error(error?.message ?? "Unable to update camera.");
  return mapCameraRow(data);
}

export async function deleteCamera(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from("cameras").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listInternetConnections(serviceId: string): Promise<InternetConnection[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("internet_connections")
    .select("*")
    .eq("service_id", serviceId)
    .order("is_backup");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapInternetRow);
}

function mapInternetRow(row: Record<string, unknown>): InternetConnection {
  const lastTestedAt = row.last_tested_at ? String(row.last_tested_at) : row.last_test_at ? String(row.last_test_at) : null;
  const uploadMbps =
    row.upload_mbps != null ? Number(row.upload_mbps) : row.last_test_mbps != null ? Number(row.last_test_mbps) : null;
  const isBackup = Boolean(row.is_backup);

  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    serviceId: String(row.service_id),
    connectionName: String(row.connection_name),
    networkName: String(row.network_name ?? row.connection_name ?? ""),
    isBackup,
    isPrimary: row.is_primary != null ? Boolean(row.is_primary) : !isBackup,
    connectionType: (row.connection_type ? String(row.connection_type) : "unknown") as InternetConnection["connectionType"],
    ssid: row.ssid != null ? String(row.ssid) : null,
    localIp: row.local_ip != null ? String(row.local_ip) : null,
    uploadStrength: row.upload_strength as InternetConnection["uploadStrength"],
    status: (row.status ? String(row.status) : "not_connected") as InternetConnection["status"],
    lastTestAt: lastTestedAt,
    lastTestedAt,
    lastConnectedAt: row.last_connected_at ? String(row.last_connected_at) : null,
    lastTestMbps: uploadMbps,
    uploadMbps,
    downloadMbps: row.download_mbps != null ? Number(row.download_mbps) : null,
    latencyMs: row.latency_ms != null ? Number(row.latency_ms) : null,
    packetLossPercent: row.packet_loss_percent != null ? Number(row.packet_loss_percent) : null,
    stabilityScore: row.stability_score != null ? Number(row.stability_score) : null,
    streamingQuality: row.streaming_quality
      ? (String(row.streaming_quality) as InternetConnection["streamingQuality"])
      : null,
    settingsJson: (row.settings_json as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function internetInsertRow(
  serviceId: string,
  tenantId: string,
  input: Partial<InternetConnection> & { connectionName: string },
): Record<string, unknown> {
  const isBackup = input.isBackup ?? false;
  const now = new Date().toISOString();
  const uploadMbps = input.uploadMbps ?? input.lastTestMbps ?? null;
  const lastTestedAt = input.lastTestedAt ?? input.lastTestAt ?? now;

  return {
    tenant_id: tenantId,
    service_id: serviceId,
    connection_name: input.connectionName,
    network_name: input.networkName ?? input.ssid ?? input.connectionName,
    is_backup: isBackup,
    is_primary: input.isPrimary ?? !isBackup,
    connection_type: input.connectionType ?? "unknown",
    ssid: input.ssid ?? null,
    local_ip: input.localIp ?? null,
    upload_strength: input.uploadStrength ?? "unknown",
    status: input.status ?? "not_connected",
    last_test_at: lastTestedAt,
    last_tested_at: lastTestedAt,
    last_connected_at: input.lastConnectedAt ?? now,
    last_test_mbps: uploadMbps,
    upload_mbps: uploadMbps,
    download_mbps: input.downloadMbps ?? null,
    latency_ms: input.latencyMs ?? null,
    packet_loss_percent: input.packetLossPercent ?? null,
    stability_score: input.stabilityScore ?? null,
    streaming_quality: input.streamingQuality ?? null,
    settings_json: input.settingsJson ?? {},
  };
}

export async function createInternetConnection(
  serviceId: string,
  tenantId: string,
  input: Partial<InternetConnection> & { connectionName: string },
): Promise<InternetConnection> {
  const { data, error } = await getSupabaseAdmin()
    .from("internet_connections")
    .insert(internetInsertRow(serviceId, tenantId, input))
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to add internet connection.");
  }
  return mapInternetRow(data);
}

export async function updateInternetConnection(
  id: string,
  patch: Partial<InternetConnection>,
): Promise<InternetConnection> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.connectionName !== undefined) update.connection_name = patch.connectionName;
  if (patch.networkName !== undefined) update.network_name = patch.networkName;
  if (patch.isBackup !== undefined) {
    update.is_backup = patch.isBackup;
    update.is_primary = !patch.isBackup;
  }
  if (patch.isPrimary !== undefined) update.is_primary = patch.isPrimary;
  if (patch.uploadStrength !== undefined) update.upload_strength = patch.uploadStrength;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.lastTestAt !== undefined) {
    update.last_test_at = patch.lastTestAt;
    update.last_tested_at = patch.lastTestAt;
  }
  if (patch.lastTestedAt !== undefined) {
    update.last_tested_at = patch.lastTestedAt;
    update.last_test_at = patch.lastTestedAt;
  }
  if (patch.lastConnectedAt !== undefined) update.last_connected_at = patch.lastConnectedAt;
  if (patch.lastTestMbps !== undefined) {
    update.last_test_mbps = patch.lastTestMbps;
    update.upload_mbps = patch.lastTestMbps;
  }
  if (patch.uploadMbps !== undefined) {
    update.upload_mbps = patch.uploadMbps;
    update.last_test_mbps = patch.uploadMbps;
  }
  if (patch.connectionType !== undefined) update.connection_type = patch.connectionType;
  if (patch.ssid !== undefined) update.ssid = patch.ssid;
  if (patch.localIp !== undefined) update.local_ip = patch.localIp;
  if (patch.downloadMbps !== undefined) update.download_mbps = patch.downloadMbps;
  if (patch.latencyMs !== undefined) update.latency_ms = patch.latencyMs;
  if (patch.packetLossPercent !== undefined) update.packet_loss_percent = patch.packetLossPercent;
  if (patch.stabilityScore !== undefined) update.stability_score = patch.stabilityScore;
  if (patch.streamingQuality !== undefined) update.streaming_quality = patch.streamingQuality;
  if (patch.settingsJson !== undefined) update.settings_json = patch.settingsJson;

  const { data, error } = await getSupabaseAdmin()
    .from("internet_connections")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to update internet.");
  }
  return mapInternetRow(data);
}

export async function deleteInternetConnection(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from("internet_connections").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listStreamingDestinations(serviceId: string): Promise<StreamingDestination[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("streaming_destinations")
    .select("*")
    .eq("service_id", serviceId)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapStreamRow);
}

function mapStreamRow(row: Record<string, unknown>): StreamingDestination {
  const connected = Boolean(row.connected);
  const legacyStatus = row.status as StreamingDestination["status"];
  const connectionStatus =
    (row.connection_status as StreamingDestination["connectionStatus"]) ??
    (connected && legacyStatus === "ready"
      ? "ready"
      : connected
        ? "connected"
        : legacyStatus === "needs_attention"
          ? "needs_attention"
          : "not_connected");

  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    serviceId: String(row.service_id),
    destinationName: String(row.destination_name),
    platform: String(row.platform),
    accountName: row.account_name != null ? String(row.account_name) : null,
    accountEmail: row.account_email != null ? String(row.account_email) : null,
    channelId: row.channel_id != null ? String(row.channel_id) : null,
    channelName: row.channel_name != null ? String(row.channel_name) : null,
    profileImageUrl: row.profile_image_url != null ? String(row.profile_image_url) : null,
    oauthPermissionsJson: (row.oauth_permissions_json as Record<string, unknown>) ?? {},
    oauthExpiresAt: row.oauth_expires_at ? String(row.oauth_expires_at) : null,
    lastAuthenticatedAt: row.last_authenticated_at ? String(row.last_authenticated_at) : null,
    lastStreamAt: row.last_stream_at ? String(row.last_stream_at) : null,
    streamCategory: row.stream_category != null ? String(row.stream_category) : null,
    scheduledStartAt: row.scheduled_start_at ? String(row.scheduled_start_at) : null,
    streamTags: Array.isArray(row.stream_tags) ? (row.stream_tags as string[]) : [],
    videoProfileJson: (row.video_profile_json as Record<string, unknown>) ?? {},
    audioProfileJson: (row.audio_profile_json as Record<string, unknown>) ?? {},
    encoderProfileJson: (row.encoder_profile_json as Record<string, unknown>) ?? {},
    networkTestJson: (row.network_test_json as Record<string, unknown>) ?? {},
    connectionQuality: row.connection_quality != null ? (row.connection_quality as StreamingDestination["connectionQuality"]) : null,
    latencyMode: row.latency_mode != null ? String(row.latency_mode) : null,
    connectionStatus,
    selectedForToday: row.selected_for_today !== false,
    lastCheckedAt: row.last_checked_at ? String(row.last_checked_at) : null,
    lastSuccessfulTestAt: row.last_successful_test_at ? String(row.last_successful_test_at) : null,
    lastErrorMessage: row.last_error_message != null ? String(row.last_error_message) : null,
    oauthStatus: String(row.oauth_status ?? "not_connected"),
    permissionStatus: String(row.permission_status ?? "unknown"),
    quotaStatus: String(row.quota_status ?? "unknown"),
    livePermissionStatus: String(row.live_permission_status ?? "unknown"),
    rtmpStatus: String(row.rtmp_status ?? "unknown"),
    destinationStatus: String(row.destination_status ?? "not_connected"),
    validationStatus: String(row.validation_status ?? "not_validated") as StreamingDestination["validationStatus"],
    validationReason: row.validation_reason != null ? String(row.validation_reason) : null,
    validationChecksJson: Array.isArray(row.validation_checks_json)
      ? (row.validation_checks_json as Array<Record<string, unknown>>)
      : [],
    lastValidatedAt: row.last_validated_at ? String(row.last_validated_at) : null,
    lastSuccessfulValidationAt: row.last_successful_validation_at ? String(row.last_successful_validation_at) : null,
    lastValidationError: row.last_validation_error != null ? String(row.last_validation_error) : null,
    websiteName: row.website_name != null ? String(row.website_name) : null,
    websiteUrl: row.website_url != null ? String(row.website_url) : null,
    streamPageUrl: row.stream_page_url != null ? String(row.stream_page_url) : null,
    embedMethod: row.embed_method === "link" || row.embed_method === "iframe" ? row.embed_method : null,
    liveStatus: normalizeStreamingLiveStatus(
      row.live_status != null ? String(row.live_status) : null,
      STREAMING_LIVE_STATUS_DEFAULT,
    ),
    broadcastExternalId: row.broadcast_external_id != null ? String(row.broadcast_external_id) : null,
    liveStartedAt: row.live_started_at ? String(row.live_started_at) : null,
    liveStoppedAt: row.live_stopped_at ? String(row.live_stopped_at) : null,
    liveDurationSeconds: row.live_duration_seconds != null ? Number(row.live_duration_seconds) : null,
    connected,
    privacy: String(row.privacy),
    streamTitle: String(row.stream_title),
    streamDescription: String(row.stream_description),
    thumbnailUrl: String(row.thumbnail_url),
    advancedJson: (row.advanced_json as Record<string, unknown>) ?? {},
    settingsJson: (row.settings_json as Record<string, unknown>) ?? {},
    status: legacyStatus,
    sortOrder: Number(row.sort_order),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export type StreamingDestinationSecrets = {
  oauthAccessToken: string | null;
  oauthRefreshToken: string | null;
  oauthExpiresAt: string | null;
  streamUrl: string | null;
  streamKey: string | null;
  backupStreamUrl: string | null;
};

export async function getStreamingDestinationSecrets(id: string): Promise<StreamingDestinationSecrets | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("streaming_destinations")
    .select(
      "oauth_access_token_encrypted,oauth_refresh_token_encrypted,oauth_expires_at,stream_url_encrypted,stream_key_encrypted,backup_stream_url_encrypted",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;

  const { decryptSecret } = await import("@/lib/streaming/encryption");

  const decryptOptional = (value: unknown): string | null => {
    if (typeof value !== "string" || !value) return null;
    try {
      return decryptSecret(value);
    } catch {
      return null;
    }
  };

  return {
    oauthAccessToken: decryptOptional(data.oauth_access_token_encrypted),
    oauthRefreshToken: decryptOptional(data.oauth_refresh_token_encrypted),
    oauthExpiresAt: data.oauth_expires_at ? String(data.oauth_expires_at) : null,
    streamUrl: decryptOptional(data.stream_url_encrypted),
    streamKey: decryptOptional(data.stream_key_encrypted),
    backupStreamUrl: decryptOptional(data.backup_stream_url_encrypted),
  };
}

export async function createStreamingDestination(
  serviceId: string,
  tenantId: string,
  input: Partial<StreamingDestination> & {
    destinationName: string;
    streamUrl?: string | null;
    streamKey?: string | null;
    backupStreamUrl?: string | null;
    oauthAccessToken?: string | null;
    oauthRefreshToken?: string | null;
    oauthExpiresAt?: string | null;
  },
): Promise<StreamingDestination> {
  const { encryptSecret } = await import("@/lib/streaming/encryption");
  const schema = await getStreamingDestinationsSchema();

  const insert: Record<string, unknown> = {
    tenant_id: tenantId,
    service_id: serviceId,
    destination_name: input.destinationName,
    platform: input.platform ?? "youtube",
    account_name: input.accountName ?? null,
    account_email: input.accountEmail ?? null,
    connection_status: input.connectionStatus ?? "not_connected",
    selected_for_today: input.selectedForToday ?? true,
    connected: input.connected ?? false,
    privacy: input.privacy ?? "public",
    stream_title: input.streamTitle ?? "",
    stream_description: input.streamDescription ?? "",
    thumbnail_url: input.thumbnailUrl ?? "",
    advanced_json: input.advancedJson ?? {},
    settings_json: input.settingsJson ?? {},
    status: input.status ?? "unknown",
    oauth_access_token_encrypted: input.oauthAccessToken ? encryptSecret(input.oauthAccessToken) : null,
    oauth_refresh_token_encrypted: input.oauthRefreshToken ? encryptSecret(input.oauthRefreshToken) : null,
    oauth_expires_at: input.oauthExpiresAt ?? null,
    stream_url_encrypted: input.streamUrl ? encryptSecret(input.streamUrl) : null,
    stream_key_encrypted: input.streamKey ? encryptSecret(input.streamKey) : null,
    backup_stream_url_encrypted: input.backupStreamUrl ? encryptSecret(input.backupStreamUrl) : null,
    live_status: assertStreamingLiveStatus(input.liveStatus ?? STREAMING_LIVE_STATUS_DEFAULT),
  };

  if (schema.setupProfiles) {
    Object.assign(insert, {
      channel_id: input.channelId ?? null,
      channel_name: input.channelName ?? null,
      profile_image_url: input.profileImageUrl ?? null,
      oauth_permissions_json: input.oauthPermissionsJson ?? {},
      last_authenticated_at: input.lastAuthenticatedAt ?? null,
      last_stream_at: input.lastStreamAt ?? null,
      stream_category: input.streamCategory ?? null,
      scheduled_start_at: input.scheduledStartAt ?? null,
      stream_tags: input.streamTags ?? [],
      video_profile_json: input.videoProfileJson ?? {},
      audio_profile_json: input.audioProfileJson ?? {},
      encoder_profile_json: input.encoderProfileJson ?? {},
      network_test_json: input.networkTestJson ?? {},
      connection_quality: input.connectionQuality ?? null,
      latency_mode: input.latencyMode ?? null,
    });
  }
  if (schema.websiteValidation) {
    Object.assign(insert, {
      website_name: input.websiteName ?? null,
      website_url: input.websiteUrl ?? null,
      stream_page_url: input.streamPageUrl ?? null,
      embed_method: input.embedMethod ?? null,
      validation_status: input.validationStatus ?? "not_validated",
      validation_reason: input.validationReason ?? null,
    });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("streaming_destinations")
    .insert(insert)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to add streaming destination.");
  return mapStreamRow(data);
}

export const STREAMING_OPTIONAL_UPDATE_KEYS = new Set<string>([
  ...STREAMING_SETUP_PROFILE_DB_COLUMNS,
  ...STREAMING_VALIDATION_DB_COLUMNS,
  ...STREAMING_VALIDATION_CHECKS_DB_COLUMNS,
  ...STREAMING_WEBSITE_VALIDATION_DB_COLUMNS,
]);

function patchUsesSetupProfiles(
  patch: Partial<StreamingDestination> & {
    oauthAccessToken?: string | null;
    oauthRefreshToken?: string | null;
    oauthExpiresAt?: string | null;
    streamUrl?: string | null;
    streamKey?: string | null;
    backupStreamUrl?: string | null;
  },
): boolean {
  return (
    patch.channelId !== undefined ||
    patch.channelName !== undefined ||
    patch.profileImageUrl !== undefined ||
    patch.oauthPermissionsJson !== undefined ||
    patch.lastAuthenticatedAt !== undefined ||
    patch.lastStreamAt !== undefined ||
    patch.streamCategory !== undefined ||
    patch.scheduledStartAt !== undefined ||
    patch.streamTags !== undefined ||
    patch.videoProfileJson !== undefined ||
    patch.audioProfileJson !== undefined ||
    patch.encoderProfileJson !== undefined ||
    patch.networkTestJson !== undefined ||
    patch.connectionQuality !== undefined ||
    patch.latencyMode !== undefined
  );
}

function patchUsesValidationColumns(patch: Partial<StreamingDestination>): boolean {
  return (
    patch.oauthStatus !== undefined ||
    patch.permissionStatus !== undefined ||
    patch.quotaStatus !== undefined ||
    patch.livePermissionStatus !== undefined ||
    patch.rtmpStatus !== undefined ||
    patch.destinationStatus !== undefined ||
    patch.lastValidatedAt !== undefined ||
    patch.lastSuccessfulValidationAt !== undefined ||
    patch.lastValidationError !== undefined
  );
}

function patchUsesWebsiteValidationColumns(patch: Partial<StreamingDestination>): boolean {
  return (
    patch.websiteName !== undefined ||
    patch.websiteUrl !== undefined ||
    patch.streamPageUrl !== undefined ||
    patch.embedMethod !== undefined ||
    patch.validationStatus !== undefined ||
    patch.validationReason !== undefined ||
    patch.validationChecksJson !== undefined
  );
}

function isStreamingOptionalSchemaError(error: { message?: string; code?: string } | null): boolean {
  if (!error?.message) return false;
  const msg = error.message.toLowerCase();
  if (error.code === "PGRST204") return true;
  if (msg.includes("schema cache") && msg.includes("streaming_destinations")) return true;
  if (msg.includes("could not find") && msg.includes("streaming_destinations")) return true;
  for (const key of STREAMING_OPTIONAL_UPDATE_KEYS) {
    if (msg.includes(key)) return true;
  }
  return false;
}

function stripStreamingOptionalUpdateKeys(update: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(update)) {
    if (!STREAMING_OPTIONAL_UPDATE_KEYS.has(key)) next[key] = value;
  }
  return next;
}

function logStreamingDestinationUpdateError(
  location: string,
  id: string,
  update: Record<string, unknown>,
  error: { message?: string; code?: string } | null,
  retriedWithoutProfile: boolean,
): void {
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/90113a7b-b2ce-449d-9c16-dbf632e3c139", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
    body: JSON.stringify({
      sessionId: "675ed0",
      runId: "wizard-save",
      hypothesisId: "H-wizard-missing-columns",
      location,
      message: "streaming destination update failed",
      data: {
        id,
        updateKeys: Object.keys(update),
        errorMessage: error?.message ?? null,
        errorCode: error?.code ?? null,
        retriedWithoutProfile,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => undefined);
  // #endregion
}

export async function updateStreamingDestination(
  id: string,
  patch: Partial<StreamingDestination> & {
    oauthAccessToken?: string | null;
    oauthRefreshToken?: string | null;
    oauthExpiresAt?: string | null;
    streamUrl?: string | null;
    streamKey?: string | null;
    backupStreamUrl?: string | null;
  },
): Promise<StreamingDestination> {
  const { encryptSecret } = await import("@/lib/streaming/encryption");
  const schema = await getStreamingDestinationsSchema();

  if (!schema.setupProfiles && patchUsesSetupProfiles(patch)) {
    throw streamingSchemaMigrationError(
      "setup_profiles",
      "Cannot update streaming setup profile fields before migration is applied.",
    );
  }
  if (!schema.validation && patchUsesValidationColumns(patch)) {
    throw streamingSchemaMigrationError(
      "validation",
      "Cannot update streaming validation fields before migration is applied.",
    );
  }
  if (!schema.websiteValidation && patchUsesWebsiteValidationColumns(patch)) {
    throw streamingSchemaMigrationError(
      "validation",
      "Cannot update church website validation fields before migration is applied.",
    );
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.destinationName !== undefined) update.destination_name = patch.destinationName;
  if (patch.platform !== undefined) update.platform = patch.platform;
  if (patch.connected !== undefined) update.connected = patch.connected;
  if (patch.accountName !== undefined) update.account_name = patch.accountName;
  if (patch.accountEmail !== undefined) update.account_email = patch.accountEmail;
  if (schema.setupProfiles) {
    if (patch.channelId !== undefined) update.channel_id = patch.channelId;
    if (patch.channelName !== undefined) update.channel_name = patch.channelName;
    if (patch.profileImageUrl !== undefined) update.profile_image_url = patch.profileImageUrl;
    if (patch.oauthPermissionsJson !== undefined) update.oauth_permissions_json = patch.oauthPermissionsJson;
    if (patch.lastAuthenticatedAt !== undefined) update.last_authenticated_at = patch.lastAuthenticatedAt;
    if (patch.lastStreamAt !== undefined) update.last_stream_at = patch.lastStreamAt;
    if (patch.streamCategory !== undefined) update.stream_category = patch.streamCategory;
    if (patch.scheduledStartAt !== undefined) update.scheduled_start_at = patch.scheduledStartAt;
    if (patch.streamTags !== undefined) update.stream_tags = patch.streamTags;
    if (patch.videoProfileJson !== undefined) update.video_profile_json = patch.videoProfileJson;
    if (patch.audioProfileJson !== undefined) update.audio_profile_json = patch.audioProfileJson;
    if (patch.encoderProfileJson !== undefined) update.encoder_profile_json = patch.encoderProfileJson;
    if (patch.networkTestJson !== undefined) update.network_test_json = patch.networkTestJson;
    if (patch.connectionQuality !== undefined) update.connection_quality = patch.connectionQuality;
    if (patch.latencyMode !== undefined) update.latency_mode = patch.latencyMode;
  }
  if (patch.connectionStatus !== undefined) {
    update.connection_status = patch.connectionStatus;
    update.status =
      patch.connectionStatus === "ready"
        ? "ready"
        : patch.connectionStatus === "needs_attention" || patch.connectionStatus === "error"
          ? "needs_attention"
          : patch.connectionStatus === "connected"
            ? "ready"
            : "not_connected";
    update.connected = patch.connectionStatus === "ready" || patch.connectionStatus === "connected";
  }
  if (patch.selectedForToday !== undefined) update.selected_for_today = patch.selectedForToday;
  if (patch.lastCheckedAt !== undefined) update.last_checked_at = patch.lastCheckedAt;
  if (patch.lastSuccessfulTestAt !== undefined) update.last_successful_test_at = patch.lastSuccessfulTestAt;
  if (patch.lastErrorMessage !== undefined) update.last_error_message = patch.lastErrorMessage;
  if (schema.validation) {
    if (patch.oauthStatus !== undefined) update.oauth_status = patch.oauthStatus;
    if (patch.permissionStatus !== undefined) update.permission_status = patch.permissionStatus;
    if (patch.quotaStatus !== undefined) update.quota_status = patch.quotaStatus;
    if (patch.livePermissionStatus !== undefined) update.live_permission_status = patch.livePermissionStatus;
    if (patch.rtmpStatus !== undefined) update.rtmp_status = patch.rtmpStatus;
    if (patch.destinationStatus !== undefined) update.destination_status = patch.destinationStatus;
    if (patch.lastValidatedAt !== undefined) update.last_validated_at = patch.lastValidatedAt;
    if (patch.lastSuccessfulValidationAt !== undefined) {
      update.last_successful_validation_at = patch.lastSuccessfulValidationAt;
    }
    if (patch.lastValidationError !== undefined) update.last_validation_error = patch.lastValidationError;
  }
  if (schema.websiteValidation) {
    if (patch.websiteName !== undefined) update.website_name = patch.websiteName;
    if (patch.websiteUrl !== undefined) update.website_url = patch.websiteUrl;
    if (patch.streamPageUrl !== undefined) update.stream_page_url = patch.streamPageUrl;
    if (patch.embedMethod !== undefined) update.embed_method = patch.embedMethod;
    if (patch.validationStatus !== undefined) update.validation_status = patch.validationStatus;
    if (patch.validationReason !== undefined) update.validation_reason = patch.validationReason;
    if (patch.validationChecksJson !== undefined) update.validation_checks_json = patch.validationChecksJson;
  }
  if (patch.liveStatus !== undefined) {
    const attempted = patch.liveStatus;
    const normalized = assertStreamingLiveStatus(attempted);
    console.info("[streaming_destinations] live_status update", { id, attempted, normalized });
    update.live_status = normalized;
  }
  if (patch.broadcastExternalId !== undefined) update.broadcast_external_id = patch.broadcastExternalId;
  if (patch.liveStartedAt !== undefined) update.live_started_at = patch.liveStartedAt;
  if (patch.liveStoppedAt !== undefined) update.live_stopped_at = patch.liveStoppedAt;
  if (patch.liveDurationSeconds !== undefined) update.live_duration_seconds = patch.liveDurationSeconds;
  if (patch.privacy !== undefined) update.privacy = patch.privacy;
  if (patch.streamTitle !== undefined) update.stream_title = patch.streamTitle;
  if (patch.streamDescription !== undefined) update.stream_description = patch.streamDescription;
  if (patch.thumbnailUrl !== undefined) update.thumbnail_url = patch.thumbnailUrl;
  if (patch.advancedJson !== undefined) update.advanced_json = patch.advancedJson;
  if (patch.settingsJson !== undefined) update.settings_json = patch.settingsJson;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.oauthAccessToken !== undefined) {
    update.oauth_access_token_encrypted = patch.oauthAccessToken ? encryptSecret(patch.oauthAccessToken) : null;
  }
  if (patch.oauthRefreshToken !== undefined) {
    update.oauth_refresh_token_encrypted = patch.oauthRefreshToken ? encryptSecret(patch.oauthRefreshToken) : null;
  }
  if (patch.oauthExpiresAt !== undefined) update.oauth_expires_at = patch.oauthExpiresAt;
  if (patch.streamUrl !== undefined) {
    update.stream_url_encrypted = patch.streamUrl ? encryptSecret(patch.streamUrl) : null;
  }
  if (patch.streamKey !== undefined) {
    update.stream_key_encrypted = patch.streamKey ? encryptSecret(patch.streamKey) : null;
  }
  if (patch.backupStreamUrl !== undefined) {
    update.backup_stream_url_encrypted = patch.backupStreamUrl ? encryptSecret(patch.backupStreamUrl) : null;
  }

  const { data, error } = await getSupabaseAdmin()
    .from("streaming_destinations")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if ((error || !data) && isStreamingOptionalSchemaError(error)) {
    const fallback = stripStreamingOptionalUpdateKeys(update);
    if (Object.keys(fallback).length > 1) {
      logStreamingDestinationUpdateError(
        "repository.ts:updateStreamingDestination",
        id,
        update,
        error,
        true,
      );
      const retry = await getSupabaseAdmin()
        .from("streaming_destinations")
        .update(fallback)
        .eq("id", id)
        .select("*")
        .single();
      if (!retry.error && retry.data) {
        return mapStreamRow(retry.data);
      }
      logStreamingDestinationUpdateError(
        "repository.ts:updateStreamingDestination:retry",
        id,
        fallback,
        retry.error,
        true,
      );
      throw streamingSchemaMigrationError(
        "setup_profiles",
        retry.error?.message ?? error?.message ?? "Streaming setup profile columns are missing.",
      );
    }
    logStreamingDestinationUpdateError(
      "repository.ts:updateStreamingDestination",
      id,
      update,
      error,
      false,
    );
    throw streamingSchemaMigrationError(
      "setup_profiles",
      error?.message ?? "Streaming setup profile columns are missing.",
    );
  }

  if (error || !data) {
    logStreamingDestinationUpdateError(
      "repository.ts:updateStreamingDestination",
      id,
      update,
      error,
      false,
    );
    throw new Error(error?.message ?? "Unable to update streaming destination.");
  }
  return mapStreamRow(data);
}

export async function deleteStreamingDestination(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from("streaming_destinations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

function mapBroadcastDestinationRow(row: Record<string, unknown>): import("@/lib/todays-service/types").ServiceBroadcastDestination {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    serviceId: String(row.service_id),
    platform: String(row.platform) as import("@/lib/streaming/types").StreamingPlatform,
    destinationId: row.destination_id != null ? String(row.destination_id) : null,
    displayOrder: Number(row.display_order) || 0,
    enabled: row.enabled !== false,
    connectedAccount: row.connected_account != null ? String(row.connected_account) : null,
    oauthStatus: String(row.oauth_status ?? "not_connected"),
    lastTestedAt: row.last_tested_at ? String(row.last_tested_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listServiceBroadcastDestinations(
  serviceId: string,
): Promise<import("@/lib/todays-service/types").ServiceBroadcastDestination[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("service_broadcast_destinations")
    .select("*")
    .eq("service_id", serviceId)
    .order("display_order");
  if (error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("service_broadcast_destinations") ||
      msg.includes("does not exist") ||
      msg.includes("schema cache") ||
      error.code === "PGRST205" ||
      error.code === "42P01"
    ) {
      return [];
    }
    throw new Error(error.message);
  }
  return (data ?? []).map(mapBroadcastDestinationRow);
}

export async function replaceServiceBroadcastDestinations(
  tenantId: string,
  serviceId: string,
  rows: Array<{
    platform: string;
    destinationId: string | null;
    displayOrder: number;
    enabled: boolean;
    connectedAccount: string | null;
    oauthStatus: string;
    lastTestedAt: string | null;
  }>,
): Promise<import("@/lib/todays-service/types").ServiceBroadcastDestination[]> {
  const admin = getSupabaseAdmin();
  const { error: delError } = await admin.from("service_broadcast_destinations").delete().eq("service_id", serviceId);
  if (delError) {
    if (!delError.message.includes("service_broadcast_destinations")) throw new Error(delError.message);
    return [];
  }
  if (rows.length === 0) return [];

  const insertRows = rows.map((row) => ({
    tenant_id: tenantId,
    service_id: serviceId,
    platform: row.platform,
    destination_id: row.destinationId,
    display_order: row.displayOrder,
    enabled: row.enabled,
    connected_account: row.connectedAccount,
    oauth_status: row.oauthStatus,
    last_tested_at: row.lastTestedAt,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await admin.from("service_broadcast_destinations").insert(insertRows).select("*");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapBroadcastDestinationRow);
}

export async function listRecordingSettings(serviceId: string): Promise<RecordingSetting[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("recording_settings")
    .select("*")
    .eq("service_id", serviceId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRecordingRow);
}

function mapRecordingRow(row: Record<string, unknown>): RecordingSetting {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    serviceId: String(row.service_id),
    recordingEnabled: Boolean(row.recording_enabled),
    recordingName: String(row.recording_name),
    saveLocation: String(row.save_location),
    storageRemainingGb: row.storage_remaining_gb != null ? Number(row.storage_remaining_gb) : null,
    backupRecording: Boolean(row.backup_recording),
    status: row.status as RecordingSetting["status"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function upsertRecordingSetting(
  serviceId: string,
  tenantId: string,
  input: Partial<RecordingSetting>,
): Promise<RecordingSetting> {
  const admin = getSupabaseAdmin();
  if (input.id) {
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.recordingEnabled !== undefined) update.recording_enabled = input.recordingEnabled;
    if (input.recordingName !== undefined) update.recording_name = input.recordingName;
    if (input.saveLocation !== undefined) update.save_location = input.saveLocation;
    if (input.storageRemainingGb !== undefined) update.storage_remaining_gb = input.storageRemainingGb;
    if (input.backupRecording !== undefined) update.backup_recording = input.backupRecording;
    if (input.status !== undefined) update.status = input.status;

    const { data, error } = await admin.from("recording_settings").update(update).eq("id", input.id).select("*").single();
    if (error || !data) throw new Error(error?.message ?? "Unable to update recording.");
    return mapRecordingRow(data);
  }

  const { data, error } = await admin
    .from("recording_settings")
    .insert({
      tenant_id: tenantId,
      service_id: serviceId,
      recording_enabled: input.recordingEnabled ?? false,
      recording_name: input.recordingName ?? "Service Recording",
      save_location: input.saveLocation ?? "",
      storage_remaining_gb: input.storageRemainingGb ?? null,
      backup_recording: input.backupRecording ?? false,
      status: input.status ?? "unknown",
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to save recording.");
  return mapRecordingRow(data);
}

export async function deleteRecordingSetting(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from("recording_settings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listPresentationSources(serviceId: string): Promise<PresentationSource[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("presentation_sources")
    .select("*")
    .eq("service_id", serviceId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapPresentationRow);
}

function mapPresentationRow(row: Record<string, unknown>): PresentationSource {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    serviceId: String(row.service_id),
    softwareName: String(row.software_name),
    connectionStatus: String(row.connection_status),
    lyricsLoaded: Boolean(row.lyrics_loaded),
    slidesLoaded: Boolean(row.slides_loaded),
    lowerThirdsEnabled: Boolean(row.lower_thirds_enabled),
    status: row.status as PresentationSource["status"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function upsertPresentationSource(
  serviceId: string,
  tenantId: string,
  input: Partial<PresentationSource>,
): Promise<PresentationSource> {
  const admin = getSupabaseAdmin();
  if (input.id) {
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.softwareName !== undefined) update.software_name = input.softwareName;
    if (input.connectionStatus !== undefined) update.connection_status = input.connectionStatus;
    if (input.lyricsLoaded !== undefined) update.lyrics_loaded = input.lyricsLoaded;
    if (input.slidesLoaded !== undefined) update.slides_loaded = input.slidesLoaded;
    if (input.lowerThirdsEnabled !== undefined) update.lower_thirds_enabled = input.lowerThirdsEnabled;
    if (input.status !== undefined) update.status = input.status;

    const { data, error } = await admin.from("presentation_sources").update(update).eq("id", input.id).select("*").single();
    if (error || !data) throw new Error(error?.message ?? "Unable to update presentation.");
    return mapPresentationRow(data);
  }

  const { data, error } = await admin
    .from("presentation_sources")
    .insert({
      tenant_id: tenantId,
      service_id: serviceId,
      software_name: input.softwareName ?? "None",
      connection_status: input.connectionStatus ?? "not_connected",
      lyrics_loaded: input.lyricsLoaded ?? false,
      slides_loaded: input.slidesLoaded ?? false,
      lower_thirds_enabled: input.lowerThirdsEnabled ?? false,
      status: input.status ?? "unknown",
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to save presentation.");
  return mapPresentationRow(data);
}

export async function deletePresentationSource(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from("presentation_sources").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listTimelineItems(serviceId: string): Promise<ServiceTimelineItem[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("service_timeline_items")
    .select("*")
    .eq("service_id", serviceId)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapTimelineRow);
}

function mapTimelineRow(row: Record<string, unknown>): ServiceTimelineItem {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    serviceId: String(row.service_id),
    partKey: String(row.part_key),
    label: String(row.label),
    durationMinutes: row.duration_minutes != null ? Number(row.duration_minutes) : null,
    sortOrder: Number(row.sort_order),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function createTimelineItem(
  serviceId: string,
  tenantId: string,
  input: { partKey: string; label: string; durationMinutes?: number | null },
): Promise<ServiceTimelineItem> {
  const admin = getSupabaseAdmin();
  const { data: maxRow } = await admin
    .from("service_timeline_items")
    .select("sort_order")
    .eq("service_id", serviceId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = maxRow ? Number(maxRow.sort_order) + 1 : 0;

  const { data, error } = await admin
    .from("service_timeline_items")
    .insert({
      tenant_id: tenantId,
      service_id: serviceId,
      part_key: input.partKey,
      label: input.label,
      duration_minutes: input.durationMinutes ?? null,
      sort_order: sortOrder,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to add timeline item.");
  return mapTimelineRow(data);
}

export async function updateTimelineItem(
  id: string,
  patch: Partial<{ label: string; durationMinutes: number | null; sortOrder: number }>,
): Promise<ServiceTimelineItem> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.label !== undefined) update.label = patch.label;
  if (patch.durationMinutes !== undefined) update.duration_minutes = patch.durationMinutes;
  if (patch.sortOrder !== undefined) update.sort_order = patch.sortOrder;

  const { data, error } = await getSupabaseAdmin()
    .from("service_timeline_items")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to update timeline item.");
  return mapTimelineRow(data);
}

export async function deleteTimelineItem(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from("service_timeline_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function reorderTimelineItems(serviceId: string, orderedIds: string[]): Promise<ServiceTimelineItem[]> {
  const admin = getSupabaseAdmin();
  await Promise.all(
    orderedIds.map((id, index) =>
      admin.from("service_timeline_items").update({ sort_order: index }).eq("id", id).eq("service_id", serviceId),
    ),
  );
  return listTimelineItems(serviceId);
}

export async function listTeamMembers(serviceId: string): Promise<TeamMember[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("team_members")
    .select("*")
    .eq("service_id", serviceId)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapTeamRow);
}

function mapTeamRow(row: Record<string, unknown>): TeamMember {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    serviceId: String(row.service_id),
    name: String(row.name),
    roleKey: row.role_key as TeamMember["roleKey"],
    email: String(row.email),
    phone: String(row.phone),
    sortOrder: Number(row.sort_order),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function createTeamMember(
  serviceId: string,
  tenantId: string,
  input: Partial<TeamMember> & { name: string },
): Promise<TeamMember> {
  const { data, error } = await getSupabaseAdmin()
    .from("team_members")
    .insert({
      tenant_id: tenantId,
      service_id: serviceId,
      name: input.name,
      role_key: input.roleKey ?? "volunteer",
      email: input.email ?? "",
      phone: input.phone ?? "",
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to add team member.");
  return mapTeamRow(data);
}

export async function updateTeamMember(id: string, patch: Partial<TeamMember>): Promise<TeamMember> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.roleKey !== undefined) update.role_key = patch.roleKey;
  if (patch.email !== undefined) update.email = patch.email;
  if (patch.phone !== undefined) update.phone = patch.phone;

  const { data, error } = await getSupabaseAdmin().from("team_members").update(update).eq("id", id).select("*").single();
  if (error || !data) throw new Error(error?.message ?? "Unable to update team member.");
  return mapTeamRow(data);
}

export async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin().from("team_members").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listAlerts(serviceId: string): Promise<ServiceAlert[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("service_alerts")
    .select("*")
    .eq("service_id", serviceId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAlertRow);
}

function mapAlertRow(row: Record<string, unknown>): ServiceAlert {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    serviceId: String(row.service_id),
    message: String(row.message),
    severity: row.severity as ServiceAlert["severity"],
    category: String(row.category),
    status: row.status as ServiceAlert["status"],
    note: String(row.note),
    sourceRef: row.source_ref ? String(row.source_ref) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function createAlert(
  serviceId: string,
  tenantId: string,
  input: { message: string; severity: string; category: string; sourceRef?: string },
): Promise<ServiceAlert> {
  const { data, error } = await getSupabaseAdmin()
    .from("service_alerts")
    .insert({
      tenant_id: tenantId,
      service_id: serviceId,
      message: input.message,
      severity: input.severity,
      category: input.category,
      source_ref: input.sourceRef ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to create alert.");
  return mapAlertRow(data);
}

export async function updateAlert(
  id: string,
  patch: Partial<{ status: string; note: string }>,
): Promise<ServiceAlert> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.note !== undefined) update.note = patch.note;

  const { data, error } = await getSupabaseAdmin().from("service_alerts").update(update).eq("id", id).select("*").single();
  if (error || !data) throw new Error(error?.message ?? "Unable to update alert.");
  return mapAlertRow(data);
}

export async function writeAuditLog(input: {
  tenantId: string;
  serviceId: string;
  userId: string;
  userEmail: string | null;
  action: string;
  detailJson?: Record<string, unknown>;
}): Promise<void> {
  await getSupabaseAdmin().from("service_audit_log").insert({
    tenant_id: input.tenantId,
    service_id: input.serviceId,
    user_id: input.userId,
    user_email: input.userEmail,
    action: input.action,
    detail_json: input.detailJson ?? {},
  });
}

export const SERVICE_EVENT_ID = DEFAULT_EVENT_ID;
