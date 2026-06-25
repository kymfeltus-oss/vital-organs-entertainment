export type CameraConnectionType = "usb" | "capture_card" | "network" | "built_in";

export type CameraLiveStatus =
  | "offline"
  | "connecting"
  | "connected"
  | "previewing"
  | "testing"
  | "needs_attention";

export type DiscoveredCamera = {
  id: string;
  label: string;
  connectionType: CameraConnectionType;
  hardwareLabel?: string | null;
  deviceIndex?: number | null;
  manufacturer?: string | null;
  model?: string | null;
  networkUrl?: string | null;
  source: "browser" | "agent_dshow" | "agent_v4l2" | "agent_scan" | string;
  /** Browser MediaDevices deviceId — client-only discovery */
  browserDeviceId?: string | null;
};

export type CameraDiscoverResult = {
  devices: DiscoveredCamera[];
  agentAvailable: boolean;
  message: string;
};

export type CameraTestResult = {
  success: boolean;
  message: string;
  latencyMs?: number | null;
};

export type CreateCameraInput = {
  name: string;
  location?: string;
  cameraType?: string;
  connectionType: CameraConnectionType;
  deviceId?: string | null;
  hardwareLabel?: string | null;
  deviceIndex?: number | null;
  networkUrl?: string | null;
  networkUsername?: string | null;
  networkPassword?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  settings?: Record<string, unknown>;
  /** Required — must match a discovered device */
  discoveredDeviceId: string;
};

export type UpdateCameraInput = {
  name?: string;
  location?: string;
  cameraType?: string;
  networkUrl?: string | null;
  networkUsername?: string | null;
  networkPassword?: string | null;
  settings?: Record<string, unknown>;
};
