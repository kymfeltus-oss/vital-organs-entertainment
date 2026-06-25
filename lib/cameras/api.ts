import type {
  CameraDiscoverResult,
  CameraTestResult,
  CreateCameraInput,
  DiscoveredCamera,
  UpdateCameraInput,
} from "@/lib/cameras/types";
import type { Camera } from "@/lib/todays-service/types";

async function cameraFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((body as { error?: string }).error ?? "Request failed.");
  return body as T;
}

export async function discoverCamerasApi(clientDevices: DiscoveredCamera[] = []): Promise<CameraDiscoverResult> {
  return cameraFetch<CameraDiscoverResult>("/api/v1/cameras/discover", {
    method: "POST",
    body: JSON.stringify({ clientDevices }),
  });
}

export async function testDiscoveredCameraApi(
  device: DiscoveredCamera,
  networkPassword?: string | null,
): Promise<CameraTestResult> {
  return cameraFetch<CameraTestResult>("/api/v1/cameras/discover/test", {
    method: "POST",
    body: JSON.stringify({ device, networkPassword: networkPassword ?? null }),
  });
}

export async function createCameraFromDiscoveryApi(
  input: CreateCameraInput,
  discovered: DiscoveredCamera,
  clientVerified = false,
): Promise<Camera> {
  return cameraFetch<{ item: Camera }>("/api/v1/cameras", {
    method: "POST",
    body: JSON.stringify({ ...input, discovered, clientVerified }),
  }).then((r) => r.item);
}

export async function updateCameraAccountApi(id: string, patch: UpdateCameraInput): Promise<Camera> {
  return cameraFetch<{ item: Camera }>(`/api/v1/cameras/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  }).then((r) => r.item);
}

export async function deleteCameraAccountApi(id: string): Promise<void> {
  await cameraFetch(`/api/v1/cameras/${id}`, { method: "DELETE" });
}

export async function testCameraAccountApi(id: string, clientVerified = false): Promise<CameraTestResult> {
  return cameraFetch<CameraTestResult>(`/api/v1/cameras/${id}/test`, {
    method: "POST",
    body: JSON.stringify({ clientVerified }),
  });
}

export async function previewCameraAccountApi(id: string): Promise<{
  success: boolean;
  message: string;
  previewMode: "browser" | "network" | "none";
  deviceId?: string;
  networkUrl?: string;
}> {
  return cameraFetch(`/api/v1/cameras/${id}/preview`, { method: "POST" });
}
