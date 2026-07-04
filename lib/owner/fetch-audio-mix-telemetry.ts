import {
  AUDIO_SILENCE_FLOOR_DB,
  buildBaselineAudioTracks,
  COCKPIT_AUDIO_TRACK_SPECS,
  OWNER_SOUND_BUS_SPECS,
  type AudioLevelTrack,
  type OwnerAudioBusTelemetry,
  type OwnerAudioTelemetry,
} from "@/lib/owner/audio-contracts";
import {
  isAudioServiceConfigured,
  resolveAudioServiceBaseUrl,
  resolveAudioServiceToken,
} from "@/lib/owner/audio-service/config";

const AUDIO_FETCH_TIMEOUT_MS = 8_000;

/** Maps each cockpit track contract to its X32 bus key on the audio worker. */
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
  muted?: boolean;
  limiterActive?: boolean;
  status?: string;
  lastUpdateAt?: string | null;
};

type AudioLoudnessSnapshot = {
  measurementMode?: "measured" | "estimated" | "unavailable";
  integratedLufs?: number | null;
  shortTermLufs?: number | null;
  momentaryLufs?: number | null;
  truePeakDb?: number | null;
  targetLufs?: number | null;
  inTarget?: boolean | null;
};

type AudioLiveSnapshot = {
  status?: {
    connection?: string;
    consoleName?: string | null;
    healthScore?: number | null;
    lastHeartbeatAt?: string | null;
    oscLatencyMs?: number | null;
  };
  buses?: AudioBusSnapshot[];
  loudness?: AudioLoudnessSnapshot;
  consoleState?: {
    currentSceneIndex?: number | null;
    currentScene?: string | null;
    sampleRate?: number | null;
    syncSource?: string | null;
    firmwareVersion?: string | null;
    lastHeartbeatAt?: string | null;
    oscLatencyMs?: number | null;
  };
};

function normalizeBusStatus(
  status: string | undefined,
  online: boolean,
): OwnerAudioBusTelemetry["status"] {
  if (!online) return "offline";
  if (status === "critical") return "critical";
  if (status === "warning") return "warning";
  return "healthy";
}

function buildSoundBuses(
  buses: AudioBusSnapshot[] | undefined,
  online: boolean,
): OwnerAudioBusTelemetry[] {
  return OWNER_SOUND_BUS_SPECS.map((spec) => {
    const bus = buses?.find((row) => row.busKey === spec.key);
    return {
      key: spec.key,
      label: bus?.displayName?.trim() || spec.label,
      levelDb: online ? (bus?.levelDb ?? AUDIO_SILENCE_FLOOR_DB) : AUDIO_SILENCE_FLOOR_DB,
      peakDb: online ? (bus?.truePeakDb ?? bus?.levelDb ?? null) : null,
      muted: bus?.muted === true,
      limiterActive: online && bus?.limiterActive === true,
      status: normalizeBusStatus(bus?.status, online),
      lastUpdateAt: bus?.lastUpdateAt ?? null,
    };
  });
}

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
  const streamBus = snapshot.buses?.find((bus) => bus.busKey === "stream_mix");
  const online = mediaNodeStatus !== "offline";
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

  return {
    edgeReachable: true,
    tracks: online ? buildLiveTracks(snapshot.buses) : buildBaselineAudioTracks(),
    buses: buildSoundBuses(snapshot.buses, online),
    capturedAt: new Date().toISOString(),
    mediaNodeStatus,
    mediaNodeDetail,
    healthScore,
    loudness: {
      measurementMode: online ? (snapshot.loudness?.measurementMode ?? "estimated") : "unavailable",
      integratedLufs: online ? (snapshot.loudness?.integratedLufs ?? null) : null,
      shortTermLufs: online ? (snapshot.loudness?.shortTermLufs ?? null) : null,
      momentaryLufs: online ? (snapshot.loudness?.momentaryLufs ?? null) : null,
      truePeakDb: online ? (snapshot.loudness?.truePeakDb ?? streamBus?.truePeakDb ?? null) : null,
      targetLufs: snapshot.loudness?.targetLufs ?? null,
      inTarget: online ? (snapshot.loudness?.inTarget ?? null) : null,
    },
    streamSafety: {
      limiterActive: online && streamBus?.limiterActive === true,
      muted: streamBus?.muted === true,
    },
    consoleScene: {
      index: snapshot.consoleState?.currentSceneIndex ?? null,
      name: snapshot.consoleState?.currentScene?.trim() || null,
    },
    console: {
      name: consoleName || null,
      online,
      sampleRateHz: snapshot.consoleState?.sampleRate ?? null,
      clockSource: snapshot.consoleState?.syncSource?.trim() || null,
      firmwareVersion: snapshot.consoleState?.firmwareVersion?.trim() || null,
      lastHeartbeatAt:
        snapshot.consoleState?.lastHeartbeatAt ?? snapshot.status?.lastHeartbeatAt ?? null,
      oscLatencyMs: snapshot.consoleState?.oscLatencyMs ?? snapshot.status?.oscLatencyMs ?? null,
    },
  };
}

function emptyLoudness(): OwnerAudioTelemetry["loudness"] {
  return {
    measurementMode: "unavailable",
    integratedLufs: null,
    shortTermLufs: null,
    momentaryLufs: null,
    truePeakDb: null,
    targetLufs: null,
    inTarget: null,
  };
}

function offlineTelemetry(detail: string): OwnerAudioTelemetry {
  return {
    edgeReachable: false,
    tracks: buildBaselineAudioTracks(),
    buses: buildSoundBuses(undefined, false),
    capturedAt: new Date().toISOString(),
    mediaNodeStatus: "offline",
    mediaNodeDetail: detail,
    healthScore: null,
    loudness: emptyLoudness(),
    streamSafety: { limiterActive: false, muted: false },
    consoleScene: { index: null, name: null },
    console: {
      name: null,
      online: false,
      sampleRateHz: null,
      clockSource: null,
      firmwareVersion: null,
      lastHeartbeatAt: null,
      oscLatencyMs: null,
    },
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
