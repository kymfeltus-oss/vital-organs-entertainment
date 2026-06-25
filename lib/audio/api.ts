import type {
  AudioHealthReport,
  AudioSettings,
  AudioSnapshot,
  AudioStatus,
  LiveAudioBus,
  LiveAudioChannel,
  LoudnessState,
  X32ConsoleState,
} from "@/lib/audio/types";

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }
  return data;
}

export async function fetchAudioStatus(): Promise<AudioStatus> {
  const response = await fetch("/api/v1/audio/status", { credentials: "include", cache: "no-store" });
  return parseJson<AudioStatus>(response);
}

export async function fetchAudioSettings(): Promise<AudioSettings> {
  const response = await fetch("/api/v1/audio/settings", { credentials: "include", cache: "no-store" });
  return parseJson<AudioSettings>(response);
}

export async function saveAudioSettings(
  patch: Partial<Omit<AudioSettings, "tenantId" | "updatedAt">>,
): Promise<AudioSettings> {
  const response = await fetch("/api/v1/audio/settings", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return parseJson<AudioSettings>(response);
}

export async function connectX32(): Promise<{ ok: boolean; message: string }> {
  const response = await fetch("/api/v1/audio/x32/connect", {
    method: "POST",
    credentials: "include",
  });
  return parseJson(response);
}

export async function disconnectX32(): Promise<{ ok: boolean }> {
  const response = await fetch("/api/v1/audio/x32/disconnect", {
    method: "POST",
    credentials: "include",
  });
  return parseJson(response);
}

export async function testX32Connection(): Promise<{ ok: boolean; latencyMs: number | null; message: string }> {
  const response = await fetch("/api/v1/audio/x32/test", {
    method: "POST",
    credentials: "include",
  });
  return parseJson(response);
}

export async function fetchX32State(): Promise<X32ConsoleState> {
  const response = await fetch("/api/v1/audio/x32/state", { credentials: "include", cache: "no-store" });
  return parseJson<X32ConsoleState>(response);
}

export async function fetchAudioChannels(): Promise<LiveAudioChannel[]> {
  const response = await fetch("/api/v1/audio/channels", { credentials: "include", cache: "no-store" });
  const data = await parseJson<{ channels: LiveAudioChannel[] }>(response);
  return data.channels;
}

export async function muteChannel(channel: number): Promise<void> {
  await parseJson(
    await fetch(`/api/v1/audio/channels/${channel}/mute`, { method: "POST", credentials: "include" }),
  );
}

export async function unmuteChannel(channel: number): Promise<void> {
  await parseJson(
    await fetch(`/api/v1/audio/channels/${channel}/unmute`, { method: "POST", credentials: "include" }),
  );
}

export async function soloChannel(channel: number): Promise<void> {
  await parseJson(
    await fetch(`/api/v1/audio/channels/${channel}/solo`, { method: "POST", credentials: "include" }),
  );
}

export async function unsoloChannel(channel: number): Promise<void> {
  await parseJson(
    await fetch(`/api/v1/audio/channels/${channel}/unsolo`, { method: "POST", credentials: "include" }),
  );
}

export async function saveChannelMapping(input: {
  x32Channel: number;
  displayName?: string;
  roleKey?: string | null;
  wireless?: boolean;
}): Promise<void> {
  await parseJson(
    await fetch(`/api/v1/audio/channels/${input.x32Channel}/mapping`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function fetchAudioBuses(): Promise<LiveAudioBus[]> {
  const response = await fetch("/api/v1/audio/buses", { credentials: "include", cache: "no-store" });
  const data = await parseJson<{ buses: LiveAudioBus[] }>(response);
  return data.buses;
}

export async function muteBus(busKey: string): Promise<void> {
  await parseJson(
    await fetch(`/api/v1/audio/buses/${encodeURIComponent(busKey)}/mute`, {
      method: "POST",
      credentials: "include",
    }),
  );
}

export async function unmuteBus(busKey: string): Promise<void> {
  await parseJson(
    await fetch(`/api/v1/audio/buses/${encodeURIComponent(busKey)}/unmute`, {
      method: "POST",
      credentials: "include",
    }),
  );
}

export async function fetchAudioHealth(): Promise<AudioHealthReport> {
  const response = await fetch("/api/v1/audio/health", { credentials: "include", cache: "no-store" });
  return parseJson<AudioHealthReport>(response);
}

export async function runAudioHealthCheck(): Promise<AudioHealthReport> {
  const response = await fetch("/api/v1/audio/health/run", {
    method: "POST",
    credentials: "include",
  });
  return parseJson<AudioHealthReport>(response);
}

export async function fetchLoudness(): Promise<LoudnessState> {
  const response = await fetch("/api/v1/audio/loudness", { credentials: "include", cache: "no-store" });
  return parseJson<LoudnessState>(response);
}

export async function fetchAudioSnapshots(): Promise<AudioSnapshot[]> {
  const response = await fetch("/api/v1/audio/snapshots", { credentials: "include", cache: "no-store" });
  const data = await parseJson<{ snapshots: AudioSnapshot[] }>(response);
  return data.snapshots;
}

export async function recallSnapshot(id: string): Promise<void> {
  await parseJson(
    await fetch(`/api/v1/audio/snapshots/${id}/recall`, { method: "POST", credentials: "include" }),
  );
}

export async function recallScene(sceneIndex: number): Promise<void> {
  await parseJson(
    await fetch(`/api/v1/audio/scenes/${sceneIndex}/recall`, { method: "POST", credentials: "include" }),
  );
}

export async function applyFeedbackNotch(frequencyHz: number, channel: number): Promise<void> {
  await parseJson(
    await fetch("/api/v1/audio/feedback/apply-notch", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frequencyHz, channel }),
    }),
  );
}

export async function runDelaySyncCheck(): Promise<void> {
  await parseJson(
    await fetch("/api/v1/audio/delay/check", { method: "POST", credentials: "include" }),
  );
}

export async function applyDelayCorrection(): Promise<void> {
  await parseJson(
    await fetch("/api/v1/audio/delay/apply-correction", { method: "POST", credentials: "include" }),
  );
}

export function buildAudioLiveWsUrl(): string {
  const configured = process.env.NEXT_PUBLIC_AUDIO_WS_URL;
  if (configured) return configured;
  if (typeof window === "undefined") return "ws://127.0.0.1:8000/ws/live";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:8000/ws/live`;
}
