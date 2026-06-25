import { agentDiscoverCameras, agentTestCameraDevice, isCameraAgentConfigured } from "@/lib/cameras/agent";
import { plainEnglishCameraError } from "@/lib/cameras/errors";
import { publishCameraLiveUpdate } from "@/lib/cameras/events";
import type {
  CameraDiscoverResult,
  CameraTestResult,
  CreateCameraInput,
  DiscoveredCamera,
  UpdateCameraInput,
} from "@/lib/cameras/types";
import {
  createCamera,
  deleteCamera,
  getOrCreateTodayService,
  listCameras,
  updateCamera,
  writeAuditLog,
} from "@/lib/todays-service/repository";
import type { Camera } from "@/lib/todays-service/types";

async function broadcastCameras(tenantId: string, serviceId: string): Promise<void> {
  const cameras = await listCameras(serviceId);
  await publishCameraLiveUpdate({ tenantId, cameras, at: new Date().toISOString() });
}

export async function discoverAllCameras(clientDevices: DiscoveredCamera[] = []): Promise<CameraDiscoverResult> {
  let agentDevices: DiscoveredCamera[] = [];
  let agentAvailable = false;
  let message = "Scanning for cameras…";

  if (isCameraAgentConfigured()) {
    try {
      const agent = await agentDiscoverCameras();
      agentDevices = agent.devices;
      agentAvailable = agent.agentAvailable;
      message = agent.message;
    } catch (error) {
      message = plainEnglishCameraError(error);
    }
  } else {
    message = "Local camera agent unavailable — using browser camera discovery only.";
  }

  const merged = new Map<string, DiscoveredCamera>();
  for (const device of [...clientDevices, ...agentDevices]) {
    merged.set(device.id, device);
  }

  // #region agent log
  fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
    body: JSON.stringify({
      sessionId: "675ed0",
      runId: "camera-discover",
      hypothesisId: "H-cam-discover",
      location: "lib/cameras/service.ts:discoverAllCameras",
      message: "discover complete",
      data: { browser: clientDevices.length, agent: agentDevices.length, total: merged.size },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return {
    devices: Array.from(merged.values()),
    agentAvailable,
    message: merged.size ? message : clientDevices.length ? "Found browser cameras." : message,
  };
}

export async function testDiscoveredDevice(
  device: DiscoveredCamera,
  networkPassword?: string | null,
  clientVerified = false,
): Promise<CameraTestResult> {
  if (device.source === "browser" && device.browserDeviceId) {
    if (!clientVerified) {
      return {
        success: false,
        message: "Confirm camera preview in your browser before saving.",
      };
    }
    return { success: true, message: "Camera is responding.", latencyMs: null };
  }

  if (!isCameraAgentConfigured()) {
    return { success: false, message: "Local camera agent unavailable. Start the production agent on this computer." };
  }

  try {
    return await agentTestCameraDevice({
      connectionType: device.connectionType,
      deviceIndex: device.deviceIndex,
      hardwareLabel: device.hardwareLabel,
      networkUrl: device.networkUrl,
      networkPassword,
    });
  } catch (error) {
    return { success: false, message: plainEnglishCameraError(error) };
  }
}

export async function getCameraForTenant(id: string, tenantId: string): Promise<Camera | null> {
  const service = await getOrCreateTodayService(tenantId);
  const cameras = await listCameras(service.id);
  return cameras.find((c) => c.id === id) ?? null;
}

export async function createCameraFromDiscovery(
  tenantId: string,
  userId: string,
  userEmail: string | null,
  input: CreateCameraInput,
  discovered: DiscoveredCamera,
  clientVerified = false,
): Promise<Camera> {
  if (!input.discoveredDeviceId || input.discoveredDeviceId !== discovered.id) {
    throw new Error("Select a discovered camera before saving.");
  }
  if (!input.name.trim()) {
    throw new Error("Camera name is required.");
  }

  const test = await testDiscoveredDevice(discovered, input.networkPassword, clientVerified);
  if (!test.success) {
    throw new Error(test.message);
  }

  const service = await getOrCreateTodayService(tenantId);
  const { encryptSecret } = await import("@/lib/streaming/encryption");

  const previewSource =
    discovered.browserDeviceId
      ? `browser://${discovered.browserDeviceId}`
      : discovered.networkUrl
        ? discovered.networkUrl
        : discovered.hardwareLabel
          ? `hardware://${discovered.hardwareLabel}`
          : "";

  const item = await createCamera(service.id, tenantId, {
    name: input.name.trim(),
    cameraType: input.cameraType ?? "fixed",
    location: input.location ?? "",
    previewSource,
    connectionType: discovered.connectionType,
    deviceId: discovered.browserDeviceId ?? discovered.id,
    hardwareLabel: discovered.hardwareLabel ?? discovered.label,
    deviceIndex: discovered.deviceIndex ?? null,
    networkUrl: input.networkUrl ?? discovered.networkUrl ?? null,
    networkUsername: input.networkUsername ?? null,
    networkPasswordEncrypted: input.networkPassword ? encryptSecret(input.networkPassword) : null,
    manufacturer: input.manufacturer ?? discovered.manufacturer ?? null,
    model: input.model ?? discovered.model ?? null,
    settingsJson: input.settings ?? {},
    status: "ready",
    liveStatus: "connected",
    lastTestAt: new Date().toISOString(),
    lastSuccessfulTestAt: new Date().toISOString(),
    lastErrorMessage: null,
  });

  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "camera_create",
    detailJson: { cameraId: item.id, connectionType: item.connectionType, discoveredDeviceId: discovered.id },
  });

  await broadcastCameras(tenantId, service.id);

  // #region agent log
  fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
    body: JSON.stringify({
      sessionId: "675ed0",
      runId: "camera-create",
      hypothesisId: "H-cam-create",
      location: "lib/cameras/service.ts:createCameraFromDiscovery",
      message: "camera saved",
      data: { id: item.id, connectionType: item.connectionType },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return item;
}

export async function updateCameraAccount(
  id: string,
  tenantId: string,
  userId: string,
  userEmail: string | null,
  input: UpdateCameraInput,
): Promise<Camera> {
  const existing = await getCameraForTenant(id, tenantId);
  if (!existing) throw new Error("Camera not found.");

  const { encryptSecret } = await import("@/lib/streaming/encryption");
  const patch: Parameters<typeof updateCamera>[1] = {
    name: input.name,
    location: input.location,
    cameraType: input.cameraType,
    networkUrl: input.networkUrl ?? undefined,
    networkUsername: input.networkUsername ?? undefined,
    settingsJson: input.settings,
  };
  if (input.networkPassword) {
    patch.networkPasswordEncrypted = encryptSecret(input.networkPassword);
  }

  const item = await updateCamera(id, patch);

  await writeAuditLog({
    tenantId,
    serviceId: existing.serviceId,
    userId,
    userEmail,
    action: "camera_update",
    detailJson: { cameraId: id },
  });

  await broadcastCameras(tenantId, existing.serviceId);
  return item;
}

export async function deleteCameraAccount(
  id: string,
  tenantId: string,
  userId: string,
  userEmail: string | null,
): Promise<void> {
  const existing = await getCameraForTenant(id, tenantId);
  if (!existing) throw new Error("Camera not found.");

  await deleteCamera(id);
  await writeAuditLog({
    tenantId,
    serviceId: existing.serviceId,
    userId,
    userEmail,
    action: "camera_delete",
    detailJson: { cameraId: id, name: existing.name },
  });
  await broadcastCameras(tenantId, existing.serviceId);
}

export async function testCameraAccount(
  id: string,
  tenantId: string,
  userId: string,
  userEmail: string | null,
  clientVerified = false,
): Promise<CameraTestResult> {
  const camera = await getCameraForTenant(id, tenantId);
  if (!camera) throw new Error("Camera not found.");

  await updateCamera(id, { liveStatus: "testing" });
  await broadcastCameras(tenantId, camera.serviceId);

  let result: CameraTestResult;

  if (camera.previewSource.startsWith("browser://")) {
    if (clientVerified) {
      result = { success: true, message: "Camera is responding.", latencyMs: null };
    } else if (camera.hardwareLabel && isCameraAgentConfigured()) {
      try {
        result = await agentTestCameraDevice({
          connectionType: camera.connectionType,
          deviceIndex: camera.deviceIndex,
          hardwareLabel: camera.hardwareLabel,
        });
      } catch (error) {
        result = { success: false, message: plainEnglishCameraError(error) };
      }
    } else {
      result = {
        success: false,
        message: "Use Preview to verify this USB camera in your browser.",
      };
    }
  } else if (isCameraAgentConfigured()) {
    try {
      result = await agentTestCameraDevice({
        connectionType: camera.connectionType,
        deviceIndex: camera.deviceIndex,
        hardwareLabel: camera.hardwareLabel,
        networkUrl: camera.networkUrl,
      });
    } catch (error) {
      result = { success: false, message: plainEnglishCameraError(error) };
    }
  } else {
    result = { success: false, message: "Local camera agent unavailable." };
  }

  const now = new Date().toISOString();
  await updateCamera(id, {
    status: result.success ? "ready" : "needs_attention",
    liveStatus: result.success ? "connected" : "needs_attention",
    lastTestAt: now,
    lastSuccessfulTestAt: result.success ? now : camera.lastSuccessfulTestAt,
    lastErrorMessage: result.success ? null : result.message,
  });

  await writeAuditLog({
    tenantId,
    serviceId: camera.serviceId,
    userId,
    userEmail,
    action: result.success ? "camera_test" : "camera_test_failed",
    detailJson: { cameraId: id, success: result.success },
  });

  await broadcastCameras(tenantId, camera.serviceId);

  // #region agent log
  fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
    body: JSON.stringify({
      sessionId: "675ed0",
      runId: "camera-test",
      hypothesisId: "H-cam-test",
      location: "lib/cameras/service.ts:testCameraAccount",
      message: "test complete",
      data: { id, success: result.success },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return result;
}

export async function previewCameraAccount(id: string, tenantId: string): Promise<{ success: boolean; message: string; previewMode: "browser" | "network" | "none"; deviceId?: string; networkUrl?: string }> {
  const camera = await getCameraForTenant(id, tenantId);
  if (!camera) throw new Error("Camera not found.");

  await updateCamera(id, { liveStatus: "previewing" });
  await broadcastCameras(tenantId, camera.serviceId);

  if (camera.previewSource.startsWith("browser://")) {
    return {
      success: true,
      message: "Preview ready.",
      previewMode: "browser",
      deviceId: camera.previewSource.replace("browser://", ""),
    };
  }
  if (camera.networkUrl) {
    return { success: true, message: "Network preview ready.", previewMode: "network", networkUrl: camera.networkUrl };
  }
  return { success: false, message: "This camera does not support preview.", previewMode: "none" };
}
