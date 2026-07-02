import {
  AUDIO_SILENCE_FLOOR_DB,
  buildBaselineAudioTracks,
  COCKPIT_AUDIO_TRACK_SPECS,
  type AudioLevelTrack,
  type OwnerAudioTelemetry,
} from "@/lib/owner/audio-contracts";
import {
  isAudioServiceConfigured,
  resolveAudioServiceBaseUrl,
  resolveAudioServiceToken,
} from "@/lib/owner/audio-service/config";

const AUDIO_FETCH_TIMEOUT_MS = 8_000;

/** Maps contract track id → X32 bus key on the audio worker. */
const TRACK_BUS_KEY_BY_ID: Record<(typeof COCKPIT_AUDIO_TRACK_SPECS)[number]["id"], string> = {
  "program-l": "lr_master",
  "program-r": "lr_master",
  "choir-bus": "choir_bus",
  spoken: "pastor_mic",
  "stream-master": "stream_mix",
};

type AudioBusSnapshot = {
  busKey: string;
  displayName: string;
  levelDb: number;
  truePeakDb?: number | null;
};

type AudioLiveSnapshot = {
  status?: {
    connection?: string;
    consoleName?: string | null;
    healthScore?: number | null;
  };
  buses?: AudioBusSnapshot[];
};

function trackFromBus(
  buses: AudioBusSnapshot[] | undefined,
  busKey: string,
  contract: (typeof COCKPIT_AUDIO_TRACK_SPECS)[number],
): AudioLevelTrack {
  const bus = buses?.find((row) => row.busKey === busKey);
  if (!bus) {
    return {
      id: contract.id,
      label: contract.label,
      levelDb: AUDIO_SILENCE_FLOOR_DB,
      peakDb: AUDIO_SILENCE_FLOOR_DB,
    };
  }

  return {
    id: contract.id,
    label: contract.label,
    levelDb: bus.levelDb,
    peakDb: bus.truePeakDb ?? bus.levelDb,
  };
}

function buildLiveTracks(buses: AudioBusSnapshot[] | undefined): AudioLevelTrack[] {
  return COCKPIT_AUDIO_TRACK_SPECS.map((contract) =>
    trackFromBus(buses, TRACK_BUS_KEY_BY_ID[contract.id], contract),
  );
}

function mapSnapshotToTelemetry(snapshot: AudioLiveSnapshot): OwnerAudioTelemetry {
  const connection = snapshot.status?.connection ?? "offline";
  const healthScore = snapshot.status?.healthScore ?? null;

  let mediaNodeStatus: OwnerAudioTelemetry["mediaNodeStatus"] = "offline";
  if (connection === "online") {
    mediaNodeStatus = healthScore !== null && healthScore < 60 ? "degraded" : "online";
  }

  const consoleName = snapshot.status?.consoleName?.trim();
  const mediaNodeDetail =
    mediaNodeStatus === "online"
      ? consoleName
        ? `${consoleName} telemetry active.`
        : "X32 telemetry active."
      : mediaNodeStatus === "degraded"
        ? "X32 connected with degraded health checks."
        : connection === "offline"
          ? "X32 console is not connected."
          : "Audio telemetry service is not connected.";

  if (mediaNodeStatus === "offline") {
    return {
      tracks: buildBaselineAudioTracks(),
      capturedAt: new Date().toISOString(),
      mediaNodeStatus: "offline",
      mediaNodeDetail,
    };
  }

  return {
    tracks: buildLiveTracks(snapshot.buses),
    capturedAt: new Date().toISOString(),
    mediaNodeStatus,
    mediaNodeDetail,
  };
}

function offlineTelemetry(detail: string): OwnerAudioTelemetry {
  return {
    tracks: buildBaselineAudioTracks(),
    capturedAt: new Date().toISOString(),
    mediaNodeStatus: "offline",
    mediaNodeDetail: detail,
  };
}

/** Loads X32 mix telemetry from the audio worker, with a safe offline fallback. */
export async function fetchOwnerAudioMixTelemetry(): Promise<OwnerAudioTelemetry> {
  if (!isAudioServiceConfigured()) {
    return offlineTelemetry(
      "Set AUDIO_SERVICE_URL and AUDIO_SERVICE_TOKEN to reach the audio worker.",
    );
  }

  const baseUrl = resolveAudioServiceBaseUrl()!;
  const token = resolveAudioServiceToken()!;

  try {
    const response = await fetch(`${baseUrl}/api/v1/audio/live/snapshot`, {
      method: "GET",
      headers: {
        "x-internal-token": token,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(AUDIO_FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      return offlineTelemetry(`Audio worker returned HTTP ${response.status}.`);
    }

    const snapshot = (await response.json()) as AudioLiveSnapshot;
    return mapSnapshotToTelemetry(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Audio worker unreachable.";
    return offlineTelemetry(message);
  }
}
