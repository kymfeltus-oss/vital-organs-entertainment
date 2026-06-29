import { isOwnerAuthed, ownerAuthFailureResponse, ownerJsonResponse } from "@/lib/owner/api-response";
import { requireOwnerUser } from "@/lib/owner/auth";
import {
  DEFAULT_AUDIO_LEVEL_TRACKS,
  DEFAULT_OWNER_AUDIO_CONFIG,
  type ConcertEqPreset,
  type OwnerAudioConfig,
} from "@/lib/owner/audio-contracts";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AudioChannelRow = {
  id: string;
  event_id: string;
  channel_id: string;
  label: string;
  level: number;
  solo: boolean;
  mute: boolean;
  updated_at: string;
};

type MasterPresetRow = {
  event_id: string;
  ai_gain_guard_enabled: boolean;
  white_noise_suppressor: number;
  concert_eq_preset: ConcertEqPreset;
  master_limiter_compressor: number;
  white_noise_suppression_preset: string;
  eq_preset_mode: string;
  compressor_limiter_db: number;
  updated_at: string;
};

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.round(value), min), max);
}

function cleanText(value: unknown, fallback: string, max = 120): string {
  return typeof value === "string" && value.trim()
    ? value.trim().replace(/<[^>]*>/g, "").slice(0, max)
    : fallback;
}

function normalizePreset(value: unknown): ConcertEqPreset {
  if (value === "spoken_word" || value === "full_choir" || value === "acoustic_prayer") return value;
  return DEFAULT_OWNER_AUDIO_CONFIG.concertEqPreset;
}

function masterRowToConfig(row: MasterPresetRow | null): OwnerAudioConfig {
  if (!row) return { ...DEFAULT_OWNER_AUDIO_CONFIG };
  return {
    aiGainGuardEnabled: row.ai_gain_guard_enabled,
    whiteNoiseSuppressor: clamp(row.white_noise_suppressor, 0, 100),
    concertEqPreset: normalizePreset(row.concert_eq_preset),
    masterLimiterCompressor: clamp(row.master_limiter_compressor, 0, 100),
  };
}

function buildTelemetry(channels: AudioChannelRow[]) {
  const tracks = channels.length
    ? channels.slice(0, 9).map((channel) => ({
        id: channel.channel_id,
        label: channel.label,
        levelDb: Number((-60 + clamp(channel.level, 0, 100) * 0.6).toFixed(1)),
        peakDb: Number((-54 + clamp(channel.level, 0, 100) * 0.58).toFixed(1)),
      }))
    : DEFAULT_AUDIO_LEVEL_TRACKS;

  return {
    tracks,
    capturedAt: new Date().toISOString(),
    mediaNodeStatus: process.env.AUDIO_SERVICE_URL?.trim() ? "online" : "degraded",
    mediaNodeDetail: process.env.AUDIO_SERVICE_URL?.trim()
      ? "Audio mix state synchronized through Supabase."
      : "Set AUDIO_SERVICE_URL to reach the production media node.",
  };
}

async function loadAudioState(eventId = "300-awakening") {
  const admin = getSupabaseAdmin();
  const [{ data: channels, error: channelError }, { data: master, error: masterError }] =
    await Promise.all([
      admin
        .from("owner_audio_mix_state")
        .select("*")
        .eq("event_id", eventId)
        .order("channel_id", { ascending: true }),
      admin.from("audio_master_presets").select("*").eq("event_id", eventId).maybeSingle(),
    ]);

  if (channelError) throw new Error(channelError.message);
  if (masterError) throw new Error(masterError.message);

  const audioChannels = (channels ?? []) as AudioChannelRow[];
  const masterRow = (master ?? null) as MasterPresetRow | null;
  const config = masterRowToConfig(masterRow);

  return {
    channels: audioChannels,
    masterSettings: masterRow ?? {
      event_id: eventId,
      ai_gain_guard_enabled: config.aiGainGuardEnabled,
      white_noise_suppressor: config.whiteNoiseSuppressor,
      concert_eq_preset: config.concertEqPreset,
      master_limiter_compressor: config.masterLimiterCompressor,
      white_noise_suppression_preset: "MEDIUM",
      eq_preset_mode: "FULL_CHOIR",
      compressor_limiter_db: -3,
      updated_at: new Date(0).toISOString(),
    },
    config,
    telemetry: buildTelemetry(audioChannels),
  };
}

export async function GET(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const eventId = new URL(request.url).searchParams.get("eventId") ?? "300-awakening";
    const state = await loadAudioState(eventId);
    return ownerJsonResponse({ success: true, ok: true, ...state });
  } catch (error) {
    console.error("[owner/audio/mix-state] GET failed:", error);
    return ownerJsonResponse(
      { success: false, error: error instanceof Error ? error.message : "Unable to load audio mix state." },
      500,
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const targetType = body.targetType;
    const eventId = cleanText(body.event_id, "300-awakening", 80);
    const admin = getSupabaseAdmin();

    if (targetType === "CHANNEL") {
      const channelId = cleanText(body.channelId ?? body.channel_id, "", 80);
      if (!channelId) {
        return ownerJsonResponse({ success: false, error: "Channel id is required." }, 400);
      }

      const level = clamp(Number(body.level), 0, 100);
      const { data, error } = await admin
        .from("owner_audio_mix_state")
        .upsert(
          {
            event_id: eventId,
            channel_id: channelId,
            label: cleanText(body.label, `Channel ${channelId}`, 120),
            level,
            solo: Boolean(body.solo),
            mute: Boolean(body.mute),
            updated_by: auth.email,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "event_id,channel_id" },
        )
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      const state = await loadAudioState(eventId);
      return ownerJsonResponse({ success: true, ok: true, updatedChannel: data, ...state });
    }

    if (targetType === "MASTER_DECK") {
      const current = await loadAudioState(eventId);
      const config = current.config;
      const patch: Record<string, unknown> = {
        event_id: eventId,
        ai_gain_guard_enabled:
          typeof body.aiGainGuardEnabled === "boolean"
            ? body.aiGainGuardEnabled
            : config.aiGainGuardEnabled,
        white_noise_suppressor:
          typeof body.whiteNoiseSuppressor === "number"
            ? clamp(body.whiteNoiseSuppressor, 0, 100)
            : config.whiteNoiseSuppressor,
        concert_eq_preset:
          body.concertEqPreset === "spoken_word" ||
          body.concertEqPreset === "full_choir" ||
          body.concertEqPreset === "acoustic_prayer"
            ? body.concertEqPreset
            : config.concertEqPreset,
        master_limiter_compressor:
          typeof body.masterLimiterCompressor === "number"
            ? clamp(body.masterLimiterCompressor, 0, 100)
            : config.masterLimiterCompressor,
        updated_by: auth.email,
        updated_at: new Date().toISOString(),
      };

      if (typeof body.whiteNoisePreset === "string") {
        patch.white_noise_suppression_preset = cleanText(body.whiteNoisePreset, "MEDIUM", 40);
      }
      if (typeof body.eqPreset === "string") {
        patch.eq_preset_mode = cleanText(body.eqPreset, "FULL_CHOIR", 60);
      }
      if (typeof body.limiterDb === "number") {
        patch.compressor_limiter_db = clamp(body.limiterDb, -24, 0);
      }

      const { data, error } = await admin
        .from("audio_master_presets")
        .upsert(patch, { onConflict: "event_id" })
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      const state = await loadAudioState(eventId);
      return ownerJsonResponse({ success: true, ok: true, updatedMaster: data, ...state });
    }

    return ownerJsonResponse(
      { success: false, error: "Invalid target operations modifier specified." },
      400,
    );
  } catch (error) {
    console.error("[owner/audio/mix-state] PATCH failed:", error);
    return ownerJsonResponse(
      { success: false, error: error instanceof Error ? error.message : "Unable to update audio mix state." },
      500,
    );
  }
}
