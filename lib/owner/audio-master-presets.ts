import type { SupabaseClient } from "@supabase/supabase-js";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";
import {
  DEFAULT_OWNER_AUDIO_CONFIG,
  type ConcertEqPreset,
  type OwnerAudioConfig,
} from "@/lib/owner/audio-contracts";

export type OwnerAudioMasterPresets = {
  config: OwnerAudioConfig;
  savedAt: string;
  savedBy: string | null;
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeConcertEqPreset(raw: unknown): ConcertEqPreset {
  if (raw === "spoken_word" || raw === "full_choir" || raw === "acoustic_prayer") {
    return raw;
  }
  return DEFAULT_OWNER_AUDIO_CONFIG.concertEqPreset;
}

function normalizeOwnerAudioConfig(raw: unknown): OwnerAudioConfig | null {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;

  if (typeof record.aiGainGuardEnabled !== "boolean") return null;
  if (typeof record.whiteNoiseSuppressor !== "number") return null;
  if (typeof record.masterLimiterCompressor !== "number") return null;

  return {
    aiGainGuardEnabled: record.aiGainGuardEnabled,
    whiteNoiseSuppressor: clampPercent(record.whiteNoiseSuppressor),
    concertEqPreset: normalizeConcertEqPreset(record.concertEqPreset),
    masterLimiterCompressor: clampPercent(record.masterLimiterCompressor),
  };
}

export function parseOwnerAudioMasterPresetsBody(body: unknown): OwnerAudioConfig | null {
  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;
  const configCandidate = record.config ?? body;
  return normalizeOwnerAudioConfig(configCandidate);
}

export function normalizeOwnerAudioMasterPresets(
  raw: unknown,
): OwnerAudioMasterPresets {
  if (!raw || typeof raw !== "object") {
    return {
      config: { ...DEFAULT_OWNER_AUDIO_CONFIG },
      savedAt: new Date(0).toISOString(),
      savedBy: null,
    };
  }

  const record = raw as Record<string, unknown>;
  const config =
    normalizeOwnerAudioConfig(record.config) ?? { ...DEFAULT_OWNER_AUDIO_CONFIG };

  return {
    config,
    savedAt: typeof record.savedAt === "string" ? record.savedAt : new Date(0).toISOString(),
    savedBy: typeof record.savedBy === "string" ? record.savedBy : null,
  };
}

export async function loadOwnerAudioMasterPresets(
  admin: SupabaseClient,
): Promise<{ presets: OwnerAudioMasterPresets; error: string | null }> {
  const { data, error } = await admin
    .from("live_stream_state")
    .select("audio_master_presets")
    .eq("id", LIVE_STREAM_STATE_ID)
    .maybeSingle();

  if (error) {
    if (/column .+ does not exist/i.test(error.message) || error.message.includes("42703")) {
      return {
        presets: {
          config: { ...DEFAULT_OWNER_AUDIO_CONFIG },
          savedAt: new Date(0).toISOString(),
          savedBy: null,
        },
        error: null,
      };
    }
    return { presets: normalizeOwnerAudioMasterPresets(null), error: error.message };
  }

  return {
    presets: normalizeOwnerAudioMasterPresets(data?.audio_master_presets),
    error: null,
  };
}

export async function saveOwnerAudioMasterPresets(
  admin: SupabaseClient,
  config: OwnerAudioConfig,
  savedBy: string,
): Promise<{ presets: OwnerAudioMasterPresets; error: string | null }> {
  const presets: OwnerAudioMasterPresets = {
    config,
    savedAt: new Date().toISOString(),
    savedBy,
  };

  const { error } = await admin
    .from("live_stream_state")
    .update({
      audio_master_presets: presets,
      updated_at: presets.savedAt,
      updated_by: savedBy,
    })
    .eq("id", LIVE_STREAM_STATE_ID);

  if (error) {
    return { presets, error: error.message };
  }

  return { presets, error: null };
}
