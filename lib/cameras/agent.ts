import { proxyAudioService, isAudioServiceConfigured } from "@/lib/audio/service-proxy";
import type { CameraDiscoverResult, CameraTestResult } from "@/lib/cameras/types";

export async function agentDiscoverCameras(): Promise<CameraDiscoverResult> {
  const raw = await proxyAudioService<{
    devices: CameraDiscoverResult["devices"];
    agentAvailable: boolean;
    message: string;
  }>("/cameras/discover");
  return {
    devices: raw.devices.map((d) => ({
      ...d,
      connectionType: d.connectionType as CameraDiscoverResult["devices"][number]["connectionType"],
    })),
    agentAvailable: raw.agentAvailable,
    message: raw.message,
  };
}

export async function agentTestCameraDevice(input: {
  connectionType: string;
  deviceIndex?: number | null;
  hardwareLabel?: string | null;
  networkUrl?: string | null;
  networkUsername?: string | null;
  networkPassword?: string | null;
}): Promise<CameraTestResult> {
  return proxyAudioService<CameraTestResult>("/cameras/test-device", {
    method: "POST",
    body: {
      connection_type: input.connectionType,
      device_index: input.deviceIndex ?? null,
      hardware_label: input.hardwareLabel ?? null,
      network_url: input.networkUrl ?? null,
      network_username: input.networkUsername ?? null,
      network_password: input.networkPassword ?? null,
    },
  });
}

export async function agentCameraHealth(): Promise<{ online: boolean; ffmpegAvailable: boolean; message: string }> {
  return proxyAudioService("/cameras/health");
}

export function isCameraAgentConfigured(): boolean {
  return isAudioServiceConfigured();
}
