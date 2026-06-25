import type {
  CreateSoundDeviceInput,
  DiscoveredSoundDevice,
  SoundDiscoverResult,
  SoundLevelsResult,
  SoundLevelsSnapshot,
  SoundTestResult,
  UpdateSoundDeviceInput,
} from "@/lib/sound/types";
import type { SoundItem } from "@/lib/todays-service/types";

import { toUserFacingSoundError } from "@/lib/sound/errors";

async function soundFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const raw = (body as { error?: string }).error ?? "Request failed.";
    throw new Error(toUserFacingSoundError(new Error(raw)));
  }
  return body as T;
}

export async function discoverSoundDevicesApi(clientDevices: DiscoveredSoundDevice[] = []): Promise<SoundDiscoverResult> {
  return soundFetch<SoundDiscoverResult>("/api/v1/sound/discover", {
    method: "POST",
    body: JSON.stringify({ clientDevices }),
  });
}

export async function testDiscoveredSoundApi(
  device: DiscoveredSoundDevice,
  clientVerified = false,
): Promise<SoundTestResult> {
  return soundFetch<SoundTestResult>("/api/v1/sound/discover/test", {
    method: "POST",
    body: JSON.stringify({ device, clientVerified }),
  });
}

export async function createSoundFromDiscoveryApi(
  input: CreateSoundDeviceInput,
  discovered: DiscoveredSoundDevice,
  clientVerified = false,
  clientTest?: SoundTestResult,
): Promise<SoundItem> {
  return soundFetch<{ item: SoundItem }>("/api/v1/sound", {
    method: "POST",
    body: JSON.stringify({ ...input, discovered, clientVerified, clientTest }),
  }).then((r) => r.item);
}

export async function updateSoundDeviceApi(id: string, patch: UpdateSoundDeviceInput): Promise<SoundItem> {
  return soundFetch<{ item: SoundItem }>(`/api/v1/sound/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  }).then((r) => r.item);
}

export async function deleteSoundDeviceApi(id: string): Promise<void> {
  await soundFetch(`/api/v1/sound/${id}`, { method: "DELETE" });
}

export async function testSoundDeviceApi(id: string, clientVerified = false): Promise<SoundTestResult> {
  return soundFetch<SoundTestResult>(`/api/v1/sound/${id}/test`, {
    method: "POST",
    body: JSON.stringify({ clientVerified }),
  });
}

export async function previewSoundDeviceApi(id: string): Promise<{
  success: boolean;
  message: string;
  previewMode: "browser" | "agent" | "none";
  deviceId?: string;
}> {
  return soundFetch(`/api/v1/sound/${id}/preview`, { method: "POST" });
}

export async function readSoundLevelsApi(id: string): Promise<SoundLevelsResult> {
  return soundFetch<SoundLevelsResult>(`/api/v1/sound/${id}/levels`, { method: "POST" });
}

export async function reconnectSoundDeviceApi(id: string): Promise<SoundTestResult> {
  return soundFetch<SoundTestResult>(`/api/v1/sound/${id}/reconnect`, { method: "POST" });
}

export async function connectSoundDeviceApi(id: string): Promise<SoundItem> {
  return soundFetch<{ item: SoundItem }>(`/api/v1/sound/${id}/connect`, { method: "POST" }).then((r) => r.item);
}

export async function disconnectSoundDeviceApi(id: string): Promise<SoundItem> {
  return soundFetch<{ item: SoundItem }>(`/api/v1/sound/${id}/disconnect`, { method: "POST" }).then((r) => r.item);
}
