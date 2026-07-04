import {
  OWNER_SOUND_BUS_SPECS,
  type OwnerAudioBusKey,
} from "@/lib/owner/audio-contracts";
import {
  isAudioServiceConfigured,
  resolveAudioServiceBaseUrl,
  resolveAudioServiceToken,
} from "@/lib/owner/audio-service/config";

const AUDIO_CONTROL_TIMEOUT_MS = 8_000;

export class AudioBusControlError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AudioBusControlError";
  }
}

export function parseOwnerAudioBusKey(value: unknown): OwnerAudioBusKey | null {
  if (typeof value !== "string") return null;
  return OWNER_SOUND_BUS_SPECS.some((bus) => bus.key === value)
    ? (value as OwnerAudioBusKey)
    : null;
}

export async function setOwnerAudioBusMute(
  busKey: OwnerAudioBusKey,
  muted: boolean,
): Promise<void> {
  if (!isAudioServiceConfigured()) {
    throw new AudioBusControlError("Audio edge service is not configured.", 503);
  }

  const action = muted ? "mute" : "unmute";
  let response: Response;
  try {
    response = await fetch(
      `${resolveAudioServiceBaseUrl()!}/api/v1/audio/buses/${busKey}/${action}`,
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
    throw new AudioBusControlError("Audio edge service is unreachable.", 502);
  }

  if (!response.ok) {
    throw new AudioBusControlError(
      `Audio edge service rejected bus ${action} (HTTP ${response.status}).`,
      502,
    );
  }
}
