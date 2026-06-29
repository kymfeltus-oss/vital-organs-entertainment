import {
  DEFAULT_AUDIO_LEVEL_TRACKS,
  DEFAULT_OWNER_AUDIO_CONFIG,
  type AudioLevelTrack,
  type ConcertEqPreset,
  type OwnerAudioConfig,
  type OwnerAudioConfigPatch,
  type OwnerAudioTelemetry,
  type OwnerAudioWorkspaceState,
} from "@/lib/owner/audio-contracts";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const DEFAULT_EVENT_ID = "300-awakening";

type MasterPresetRow = {
  ai_gain_guard_enabled: boolean;
  white_noise_suppressor: number;
  concert_eq_preset: ConcertEqPreset;
  master_limiter_compressor: number;
};

type AudioChannelRow = {
  channel_id: string;
  label: string;
  level: number;
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeConcertEqPreset(value: unknown): ConcertEqPreset {
  if (value === "spoken_word" || value === "full_choir" || value === "acoustic_prayer") return value;
  return DEFAULT_OWNER_AUDIO_CONFIG.concertEqPreset;
}

function rowToConfig(row: Partial<MasterPresetRow> | null | undefined): OwnerAudioConfig {
  if (!row) return { ...DEFAULT_OWNER_AUDIO_CONFIG };
  return {
    aiGainGuardEnabled:
      typeof row.ai_gain_guard_enabled === "boolean"
        ? row.ai_gain_guard_enabled
        : DEFAULT_OWNER_AUDIO_CONFIG.aiGainGuardEnabled,
    whiteNoiseSuppressor:
      typeof row.white_noise_suppressor === "number"
        ? clampPercent(row.white_noise_suppressor)
        : DEFAULT_OWNER_AUDIO_CONFIG.whiteNoiseSuppressor,
    concertEqPreset: normalizeConcertEqPreset(row.concert_eq_preset),
    masterLimiterCompressor:
      typeof row.master_limiter_compressor === "number"
        ? clampPercent(row.master_limiter_compressor)
        : DEFAULT_OWNER_AUDIO_CONFIG.masterLimiterCompressor,
  };
}

function levelToDb(level: number): number {
  return Number((-60 + clampPercent(level) * 0.6).toFixed(1));
}

function channelsToTracks(rows: AudioChannelRow[]): AudioLevelTrack[] {
  if (!rows.length) return DEFAULT_AUDIO_LEVEL_TRACKS;
  return rows.slice(0, 12).map((row) => {
    const levelDb = levelToDb(row.level);
    return {
      id: row.channel_id,
      label: row.label,
      levelDb,
      peakDb: Math.min(0, Number((levelDb + 8).toFixed(1))),
    };
  });
}

export async function getOwnerAudioWorkspaceState(): Promise<OwnerAudioWorkspaceState> {
  const admin = getSupabaseAdmin();
  const [{ data: preset, error: presetError }, { data: channels, error: channelError }] =
    await Promise.all([
      admin
        .from("audio_master_presets")
        .select("ai_gain_guard_enabled, white_noise_suppressor, concert_eq_preset, master_limiter_compressor")
        .eq("event_id", DEFAULT_EVENT_ID)
        .maybeSingle(),
      admin
        .from("owner_audio_mix_state")
        .select("channel_id, label, level")
        .eq("event_id", DEFAULT_EVENT_ID)
        .order("channel_id", { ascending: true }),
    ]);

  if (presetError) throw new Error(presetError.message);
  if (channelError) throw new Error(channelError.message);

  const telemetry: OwnerAudioTelemetry = {
    tracks: channelsToTracks((channels ?? []) as AudioChannelRow[]),
    capturedAt: new Date().toISOString(),
    mediaNodeStatus: process.env.AUDIO_SERVICE_URL?.trim() ? "online" : "degraded",
    mediaNodeDetail: process.env.AUDIO_SERVICE_URL?.trim()
      ? "Audio configuration synchronized through Supabase."
      : "Set AUDIO_SERVICE_URL to reach the production media node.",
  };

  return {
    config: rowToConfig(preset as MasterPresetRow | null),
    telemetry,
  };
}

export async function applyOwnerAudioConfigPatch(
  patch: OwnerAudioConfigPatch,
): Promise<OwnerAudioWorkspaceState> {
  const current = await getOwnerAudioWorkspaceState();
  const nextConfig = {
    ...current.config,
    ...patch,
    whiteNoiseSuppressor:
      patch.whiteNoiseSuppressor !== undefined
        ? clampPercent(patch.whiteNoiseSuppressor)
        : current.config.whiteNoiseSuppressor,
    masterLimiterCompressor:
      patch.masterLimiterCompressor !== undefined
        ? clampPercent(patch.masterLimiterCompressor)
        : current.config.masterLimiterCompressor,
    concertEqPreset: normalizeConcertEqPreset(patch.concertEqPreset ?? current.config.concertEqPreset),
  };

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("audio_master_presets")
    .upsert(
      {
        event_id: DEFAULT_EVENT_ID,
        ai_gain_guard_enabled: nextConfig.aiGainGuardEnabled,
        white_noise_suppressor: nextConfig.whiteNoiseSuppressor,
        concert_eq_preset: nextConfig.concertEqPreset,
        master_limiter_compressor: nextConfig.masterLimiterCompressor,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id" },
    );

  if (error) throw new Error(error.message);
  return getOwnerAudioWorkspaceState();
}

export function parseOwnerAudioConfigPatch(body: unknown): OwnerAudioConfigPatch | null {
  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;
  const patch: OwnerAudioConfigPatch = {};

  if (typeof record.aiGainGuardEnabled === "boolean") {
    patch.aiGainGuardEnabled = record.aiGainGuardEnabled;
  }

  if (typeof record.whiteNoiseSuppressor === "number") {
    patch.whiteNoiseSuppressor = clampPercent(record.whiteNoiseSuppressor);
  }

  if (
    record.concertEqPreset === "spoken_word" ||
    record.concertEqPreset === "full_choir" ||
    record.concertEqPreset === "acoustic_prayer"
  ) {
    patch.concertEqPreset = record.concertEqPreset;
  }

  if (typeof record.masterLimiterCompressor === "number") {
    patch.masterLimiterCompressor = clampPercent(record.masterLimiterCompressor);
  }

  return Object.keys(patch).length > 0 ? patch : null;
}
