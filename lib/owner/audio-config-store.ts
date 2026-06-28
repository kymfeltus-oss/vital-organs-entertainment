import {
  DEFAULT_AUDIO_LEVEL_TRACKS,
  DEFAULT_OWNER_AUDIO_CONFIG,
  type OwnerAudioConfig,
  type OwnerAudioConfigPatch,
  type OwnerAudioTelemetry,
  type OwnerAudioWorkspaceState,
} from "@/lib/owner/audio-contracts";

/** In-process owner audio config until media-node persistence is wired. */
let storedConfig: OwnerAudioConfig = { ...DEFAULT_OWNER_AUDIO_CONFIG };

function jitterDb(base: number, spread = 4): number {
  const delta = (Math.random() - 0.5) * spread;
  return Math.max(-60, Math.min(0, base + delta));
}

export function getOwnerAudioWorkspaceState(): OwnerAudioWorkspaceState {
  const tracks = DEFAULT_AUDIO_LEVEL_TRACKS.map((track) => ({
    ...track,
    levelDb: jitterDb(track.levelDb, storedConfig.aiGainGuardEnabled ? 2 : 5),
    peakDb: track.peakDb,
  }));

  const telemetry: OwnerAudioTelemetry = {
    tracks,
    capturedAt: new Date().toISOString(),
    mediaNodeStatus: process.env.AUDIO_SERVICE_URL?.trim() ? "online" : "degraded",
    mediaNodeDetail: process.env.AUDIO_SERVICE_URL?.trim()
      ? "Telemetry stub — connect Parable/audio agent for live meters."
      : "Set AUDIO_SERVICE_URL to reach the production media node.",
  };

  return { config: { ...storedConfig }, telemetry };
}

export function applyOwnerAudioConfigPatch(
  patch: OwnerAudioConfigPatch,
): OwnerAudioWorkspaceState {
  storedConfig = {
    ...storedConfig,
    ...patch,
    whiteNoiseSuppressor:
      patch.whiteNoiseSuppressor !== undefined
        ? clampPercent(patch.whiteNoiseSuppressor)
        : storedConfig.whiteNoiseSuppressor,
    masterLimiterCompressor:
      patch.masterLimiterCompressor !== undefined
        ? clampPercent(patch.masterLimiterCompressor)
        : storedConfig.masterLimiterCompressor,
  };

  return getOwnerAudioWorkspaceState();
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function parseOwnerAudioConfigPatch(body: unknown): OwnerAudioConfigPatch | null {
  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;
  const patch: OwnerAudioConfigPatch = {};

  if (typeof record.aiGainGuardEnabled === "boolean") {
    patch.aiGainGuardEnabled = record.aiGainGuardEnabled;
  }

  if (typeof record.whiteNoiseSuppressor === "number") {
    patch.whiteNoiseSuppressor = record.whiteNoiseSuppressor;
  }

  if (
    record.concertEqPreset === "spoken_word" ||
    record.concertEqPreset === "full_choir" ||
    record.concertEqPreset === "acoustic_prayer"
  ) {
    patch.concertEqPreset = record.concertEqPreset;
  }

  if (typeof record.masterLimiterCompressor === "number") {
    patch.masterLimiterCompressor = record.masterLimiterCompressor;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}
