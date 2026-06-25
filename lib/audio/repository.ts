import { DEFAULT_AUDIO_TENANT_ID } from "@/lib/audio/auth";
import type {
  AudioChannelMapping,
  AudioSettings,
  AudioSnapshot,
} from "@/lib/audio/types";
import { DEFAULT_AUDIO_SETTINGS } from "@/lib/audio/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type SettingsRow = {
  tenant_id: string;
  x32_ip: string;
  x32_osc_port: number;
  connection_timeout_ms: number;
  meter_refresh_rate_ms: number;
  lufs_target: number;
  true_peak_ceiling: number;
  feedback_sensitivity: number;
  wireless_battery_warning_pct: number;
  wireless_battery_critical_pct: number;
  stream_silence_threshold_db: number;
  recording_silence_threshold_db: number;
  auto_create_incidents: boolean;
  auto_apply_scene_snapshots: boolean;
  enable_automation_rules: boolean;
  enable_health_check_before_go_live: boolean;
  enable_talkback_controls: boolean;
  enable_audit_logging: boolean;
  console_display_name: string;
  updated_at: string;
};

function mapSettings(row: SettingsRow): AudioSettings {
  return {
    tenantId: row.tenant_id,
    x32Ip: row.x32_ip,
    x32OscPort: row.x32_osc_port,
    connectionTimeoutMs: row.connection_timeout_ms,
    meterRefreshRateMs: row.meter_refresh_rate_ms,
    lufsTarget: Number(row.lufs_target),
    truePeakCeiling: Number(row.true_peak_ceiling),
    feedbackSensitivity: Number(row.feedback_sensitivity),
    wirelessBatteryWarningPct: row.wireless_battery_warning_pct,
    wirelessBatteryCriticalPct: row.wireless_battery_critical_pct,
    streamSilenceThresholdDb: Number(row.stream_silence_threshold_db),
    recordingSilenceThresholdDb: Number(row.recording_silence_threshold_db),
    autoCreateIncidents: row.auto_create_incidents,
    autoApplySceneSnapshots: row.auto_apply_scene_snapshots,
    enableAutomationRules: row.enable_automation_rules,
    enableHealthCheckBeforeGoLive: row.enable_health_check_before_go_live,
    enableTalkbackControls: row.enable_talkback_controls,
    enableAuditLogging: row.enable_audit_logging,
    consoleDisplayName: row.console_display_name,
    updatedAt: row.updated_at,
  };
}

export async function getAudioSettings(tenantId = DEFAULT_AUDIO_TENANT_ID): Promise<AudioSettings> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("audio_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    return {
      tenantId,
      ...DEFAULT_AUDIO_SETTINGS,
      updatedAt: new Date().toISOString(),
    };
  }
  return mapSettings(data as SettingsRow);
}

export async function updateAudioSettings(
  tenantId: string,
  patch: Partial<Omit<AudioSettings, "tenantId" | "updatedAt">>,
  userId: string | null,
): Promise<AudioSettings> {
  const admin = getSupabaseAdmin();
  const payload = {
    x32_ip: patch.x32Ip,
    x32_osc_port: patch.x32OscPort,
    connection_timeout_ms: patch.connectionTimeoutMs,
    meter_refresh_rate_ms: patch.meterRefreshRateMs,
    lufs_target: patch.lufsTarget,
    true_peak_ceiling: patch.truePeakCeiling,
    feedback_sensitivity: patch.feedbackSensitivity,
    wireless_battery_warning_pct: patch.wirelessBatteryWarningPct,
    wireless_battery_critical_pct: patch.wirelessBatteryCriticalPct,
    stream_silence_threshold_db: patch.streamSilenceThresholdDb,
    recording_silence_threshold_db: patch.recordingSilenceThresholdDb,
    auto_create_incidents: patch.autoCreateIncidents,
    auto_apply_scene_snapshots: patch.autoApplySceneSnapshots,
    enable_automation_rules: patch.enableAutomationRules,
    enable_health_check_before_go_live: patch.enableHealthCheckBeforeGoLive,
    enable_talkback_controls: patch.enableTalkbackControls,
    enable_audit_logging: patch.enableAuditLogging,
    console_display_name: patch.consoleDisplayName,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  };

  const cleaned = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );

  const { data, error } = await admin
    .from("audio_settings")
    .upsert({ tenant_id: tenantId, ...cleaned }, { onConflict: "tenant_id" })
    .select("*")
    .single();

  if (error) throw error;
  return mapSettings(data as SettingsRow);
}

export async function listChannelMappings(
  tenantId = DEFAULT_AUDIO_TENANT_ID,
): Promise<AudioChannelMapping[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("audio_channel_mappings")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("x32_channel", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    x32Channel: row.x32_channel,
    displayName: row.display_name,
    roleKey: row.role_key,
    wireless: row.wireless,
    wirelessChannel: row.wireless_channel,
    backupAvailable: row.backup_available,
    groupKey: row.group_key,
    thresholdDb: row.threshold_db,
  }));
}

export async function upsertChannelMapping(
  tenantId: string,
  input: {
    x32Channel: number;
    displayName?: string;
    roleKey?: string | null;
    wireless?: boolean;
    wirelessChannel?: string | null;
    backupAvailable?: boolean;
    groupKey?: string | null;
    thresholdDb?: number | null;
  },
): Promise<AudioChannelMapping> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("audio_channel_mappings")
    .upsert(
      {
        tenant_id: tenantId,
        x32_channel: input.x32Channel,
        display_name: input.displayName ?? "",
        role_key: input.roleKey ?? null,
        wireless: input.wireless ?? false,
        wireless_channel: input.wirelessChannel ?? null,
        backup_available: input.backupAvailable ?? false,
        group_key: input.groupKey ?? null,
        threshold_db: input.thresholdDb ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,x32_channel" },
    )
    .select("*")
    .single();

  if (error) throw error;

  return {
    id: data.id,
    tenantId: data.tenant_id,
    x32Channel: data.x32_channel,
    displayName: data.display_name,
    roleKey: data.role_key,
    wireless: data.wireless,
    wirelessChannel: data.wireless_channel,
    backupAvailable: data.backup_available,
    groupKey: data.group_key,
    thresholdDb: data.threshold_db,
  };
}

export async function listAudioSnapshots(tenantId = DEFAULT_AUDIO_TENANT_ID): Promise<AudioSnapshot[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("audio_snapshots")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    mappedScene: row.mapped_scene,
    description: row.description,
    lastUsedAt: row.last_used_at,
    status: row.status,
    isPreshowDefault: row.is_preshow_default,
    isGoLiveDefault: row.is_go_live_default,
  }));
}

export async function writeAudioAuditLog(input: {
  tenantId?: string;
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const admin = getSupabaseAdmin();
  await admin.from("audit_logs").insert({
    tenant_id: input.tenantId ?? DEFAULT_AUDIO_TENANT_ID,
    user_id: input.userId ?? null,
    user_email: input.userEmail ?? null,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    metadata: input.metadata ?? {},
  });
}
