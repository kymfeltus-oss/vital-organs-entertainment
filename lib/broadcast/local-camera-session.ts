/** Client-only session flags for in-app camera / desk engine controls. */

export type BroadcastCameraEngineStatus = "running" | "stopped";

const LOCAL_CAMERA_KEY = "broadcast_local_camera_active";
const ENGINE_STATUS_KEY = "broadcast_camera_engine_status";

export function readBroadcastLocalCameraActive(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(LOCAL_CAMERA_KEY) === "1";
}

export function readBroadcastCameraEngineStatus(): BroadcastCameraEngineStatus {
  if (typeof window === "undefined") return "stopped";
  const value = window.sessionStorage.getItem(ENGINE_STATUS_KEY);
  return value === "running" ? "running" : "stopped";
}

export function setBroadcastLocalCameraActive(active: boolean): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(LOCAL_CAMERA_KEY, active ? "1" : "0");
  setBroadcastCameraEngineStatus(active ? "running" : "stopped");
  window.dispatchEvent(
    new CustomEvent("broadcast-local-camera-changed", { detail: { active } }),
  );
}

export function setBroadcastCameraEngineStatus(status: BroadcastCameraEngineStatus): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ENGINE_STATUS_KEY, status);
  window.dispatchEvent(
    new CustomEvent("broadcast-camera-engine-changed", { detail: { status } }),
  );
}
