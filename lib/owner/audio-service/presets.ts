import {
  AUDIO_PRESET_SPECS,
  type AudioPresetStatus,
  type ConcertEqPreset,
} from "@/lib/owner/audio-contracts";
import {
  isAudioServiceConfigured,
  resolveAudioServiceBaseUrl,
  resolveAudioServiceToken,
} from "@/lib/owner/audio-service/config";

const AUDIO_CONTROL_TIMEOUT_MS = 8_000;
const MIN_X32_SCENE_INDEX = 1;
const MAX_X32_SCENE_INDEX = 100;

const PRESET_SCENE_ENV: Record<ConcertEqPreset, string> = {
  full_choir: "AUDIO_PRESET_FULL_CHOIR_SCENE",
  spoken_word: "AUDIO_PRESET_SPOKEN_WORD_SCENE",
  acoustic_prayer: "AUDIO_PRESET_ACOUSTIC_PRAYER_SCENE",
};

export class AudioPresetControlError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AudioPresetControlError";
  }
}

export function parseAudioPresetId(value: unknown): ConcertEqPreset | null {
  if (typeof value !== "string") return null;
  return AUDIO_PRESET_SPECS.some((preset) => preset.id === value)
    ? (value as ConcertEqPreset)
    : null;
}

function parseSceneIndex(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < MIN_X32_SCENE_INDEX || value > MAX_X32_SCENE_INDEX) {
    return null;
  }
  return value;
}

function resolvePresetSceneIndex(presetId: ConcertEqPreset): number | null {
  return parseSceneIndex(process.env[PRESET_SCENE_ENV[presetId]]);
}

export function buildAudioPresetStatuses(currentSceneIndex: number | null): AudioPresetStatus[] {
  return AUDIO_PRESET_SPECS.map((preset) => {
    const sceneIndex = resolvePresetSceneIndex(preset.id);
    return {
      ...preset,
      configured: sceneIndex !== null,
      active: sceneIndex !== null && sceneIndex === currentSceneIndex,
    };
  });
}

export async function applyAudioPreset(presetId: ConcertEqPreset): Promise<void> {
  if (!isAudioServiceConfigured()) {
    throw new AudioPresetControlError("Audio edge service is not configured.", 503);
  }

  const sceneIndex = resolvePresetSceneIndex(presetId);
  if (sceneIndex === null) {
    throw new AudioPresetControlError("This audio preset is not mapped to an X32 scene.", 409);
  }

  let response: Response;
  try {
    response = await fetch(
      `${resolveAudioServiceBaseUrl()!}/api/v1/audio/scenes/${sceneIndex}/recall`,
      {
        method: "POST",
        headers: {
          "x-internal-token": resolveAudioServiceToken()!,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(AUDIO_CONTROL_TIMEOUT_MS),
      },
    );
  } catch {
    throw new AudioPresetControlError("Audio edge service is unreachable.", 502);
  }

  if (!response.ok) {
    throw new AudioPresetControlError(
      `Audio edge service rejected preset recall (HTTP ${response.status}).`,
      502,
    );
  }
}
