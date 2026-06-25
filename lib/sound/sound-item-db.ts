import { isSchemaCacheError } from "@/lib/sound/errors";
import type { SoundItem } from "@/lib/todays-service/types";

/** Columns required for production sound device persistence (matches DB migration). */
export const SOUND_ITEM_CANONICAL_INSERT_KEYS = [
  "tenant_id",
  "service_id",
  "name",
  "device_id",
  "device_name",
  "device_label",
  "manufacturer",
  "connection_type",
  "device_type",
  "sample_rate",
  "channel_count",
  "signal_present",
  "peak_level",
  "average_level",
  "clipping_detected",
  "status",
  "last_tested_at",
  "last_connected_at",
  "last_error_message",
  "settings_json",
  "category",
  "sort_order",
] as const;

type SupabaseInsertError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

export function isSoundItemSchemaInsertError(error: unknown): boolean {
  if (isSchemaCacheError(error)) return true;
  const code = (error as SupabaseInsertError)?.code;
  // PGRST204: missing column in schema cache; 42703: undefined_column; 23514: check_violation (enum mismatch)
  return code === "PGRST204" || code === "42703" || code === "23514";
}

export function logSoundItemInsertFailure(
  error: SupabaseInsertError | null,
  row: Record<string, unknown>,
  tenantId: string,
  serviceId: string,
  attempt: "canonical" | "base",
): void {
  console.error("[SOUND_ITEM_INSERT_ERR]", {
    attempt,
    message: error?.message ?? null,
    details: error?.details ?? null,
    hint: error?.hint ?? null,
    code: error?.code ?? null,
    tenant_id: tenantId,
    service_id: serviceId,
    insert_keys: Object.keys(row).sort(),
  });
}

function buildSettingsJson(input: Partial<SoundItem> & { category: string }): Record<string, unknown> {
  const base = { ...(input.settingsJson ?? input.configJson ?? {}) };
  return {
    ...base,
    category: input.category,
    liveStatus: input.liveStatus ?? "offline",
    levels: input.levelsJson ?? {},
    health: input.healthJson ?? {},
    mixerType: input.mixerType ?? null,
    mixerIp: input.mixerIp ?? null,
    deviceIndex: input.deviceIndex ?? null,
    hardwareLabel: input.deviceLabel ?? input.hardwareLabel ?? null,
    model: input.model ?? null,
    lastSuccessfulTestAt: input.lastSuccessfulTestAt ?? null,
    deviceType: input.deviceType ?? "microphone",
    connectionType: input.connectionType ?? "unknown",
    signalPresent: input.signalPresent ?? false,
    peakLevel: input.peakLevel ?? null,
    averageLevel: input.averageLevel ?? null,
    clippingDetected: input.clippingDetected ?? false,
    sampleRate: input.sampleRate ?? null,
    channelCount: input.channelCount ?? null,
    deviceId: input.deviceId ?? null,
    lastTestedAt: input.lastTestedAt ?? input.lastTestAt ?? null,
    lastConnectedAt: input.lastConnectedAt ?? null,
  };
}

/** Insert row using only canonical production columns (+ category/sort_order). */
export function buildCanonicalSoundItemInsertRow(
  serviceId: string,
  tenantId: string,
  input: Partial<SoundItem> & { category: string; name: string },
): Record<string, unknown> {
  const deviceName = (input.deviceName ?? input.name).trim();
  const deviceLabel = input.deviceLabel ?? input.hardwareLabel ?? deviceName;
  const levels = input.levelsJson ?? {};
  const lastTestedAt = input.lastTestedAt ?? input.lastTestAt ?? null;

  const row: Record<string, unknown> = {
    tenant_id: tenantId,
    service_id: serviceId,
    name: deviceName,
    device_id: input.deviceId ?? null,
    device_name: deviceName,
    device_label: deviceLabel,
    manufacturer: input.manufacturer ?? null,
    connection_type: input.connectionType ?? "unknown",
    device_type: input.deviceType ?? "microphone",
    sample_rate: input.sampleRate ?? null,
    channel_count: input.channelCount ?? null,
    signal_present: input.signalPresent ?? Boolean(levels.signalPresent ?? false),
    peak_level: input.peakLevel ?? (typeof levels.peak === "number" ? levels.peak : null),
    average_level: input.averageLevel ?? (typeof levels.rms === "number" ? levels.rms : null),
    clipping_detected: input.clippingDetected ?? Boolean(levels.clipping ?? false),
    status: input.status ?? "not_connected",
    last_tested_at: lastTestedAt,
    last_connected_at: input.lastConnectedAt ?? null,
    last_error_message: input.lastErrorMessage ?? null,
    settings_json: buildSettingsJson(input),
    category: input.category,
    sort_order: input.sortOrder ?? 0,
  };

  return row;
}

/** Fallback for databases that only have the original sound_items table. */
export function buildBaseSoundItemInsertRow(
  serviceId: string,
  tenantId: string,
  input: Partial<SoundItem> & { category: string; name: string },
): Record<string, unknown> {
  const deviceName = (input.deviceName ?? input.name).trim();
  const status = input.status ?? "not_connected";
  const legacyStatus: "ready" | "needs_attention" | "not_connected" | "unknown" =
    status === "connected"
      ? "ready"
      : status === "error"
        ? "needs_attention"
        : status === "ready" || status === "needs_attention" || status === "not_connected"
          ? status
          : "not_connected";

  return {
    tenant_id: tenantId,
    service_id: serviceId,
    category: input.category,
    name: deviceName,
    status: legacyStatus,
    config_json: buildSettingsJson(input),
    sort_order: input.sortOrder ?? 0,
  };
}

export function settingsToSoundFields(settings: Record<string, unknown>): Partial<SoundItem> {
  const levels = (settings.levels as Record<string, unknown>) ?? {};
  return {
    liveStatus: (settings.liveStatus as SoundItem["liveStatus"]) ?? undefined,
    levelsJson: levels,
    healthJson: (settings.health as Record<string, unknown>) ?? {},
    mixerType: settings.mixerType != null ? String(settings.mixerType) : null,
    mixerIp: settings.mixerIp != null ? String(settings.mixerIp) : null,
    deviceIndex: settings.deviceIndex != null ? Number(settings.deviceIndex) : null,
    hardwareLabel: settings.hardwareLabel != null ? String(settings.hardwareLabel) : null,
    model: settings.model != null ? String(settings.model) : null,
    lastSuccessfulTestAt:
      settings.lastSuccessfulTestAt != null ? String(settings.lastSuccessfulTestAt) : null,
    deviceType: (settings.deviceType as SoundItem["deviceType"]) ?? undefined,
    connectionType: (settings.connectionType as SoundItem["connectionType"]) ?? undefined,
    signalPresent: settings.signalPresent != null ? Boolean(settings.signalPresent) : undefined,
    peakLevel: settings.peakLevel != null ? Number(settings.peakLevel) : undefined,
    averageLevel: settings.averageLevel != null ? Number(settings.averageLevel) : undefined,
    clippingDetected: settings.clippingDetected != null ? Boolean(settings.clippingDetected) : undefined,
    sampleRate: settings.sampleRate != null ? Number(settings.sampleRate) : undefined,
    channelCount: settings.channelCount != null ? Number(settings.channelCount) : undefined,
    deviceId: settings.deviceId != null ? String(settings.deviceId) : undefined,
    lastTestedAt: settings.lastTestedAt != null ? String(settings.lastTestedAt) : undefined,
    lastConnectedAt: settings.lastConnectedAt != null ? String(settings.lastConnectedAt) : undefined,
  };
}
