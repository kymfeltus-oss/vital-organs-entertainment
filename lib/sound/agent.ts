import { proxyAudioService } from "@/lib/audio/service-proxy";
import type { DiscoveredSoundDevice, SoundDiscoverResult, SoundLevelsSnapshot, SoundTestResult } from "@/lib/sound/types";

export function isSoundAgentConfigured(): boolean {
  return Boolean(process.env.AUDIO_SERVICE_URL || process.env.NEXT_PUBLIC_AUDIO_WS_URL);
}

export async function agentDiscoverSoundDevices(mixerType = "behringer_x32", hintIps: string[] = []): Promise<SoundDiscoverResult> {
  return proxyAudioService<SoundDiscoverResult>("/sound/discover", {
    method: "POST",
    body: { mixerType, hintIps },
  });
}

export async function agentTestSoundDevice(device: DiscoveredSoundDevice): Promise<SoundTestResult> {
  return proxyAudioService<SoundTestResult>("/sound/test-device", {
    method: "POST",
    body: {
      device: {
        id: device.id,
        deviceIndex: device.deviceIndex,
        hardwareLabel: device.hardwareLabel,
        connectionType: device.connectionType,
        browserDeviceId: device.browserDeviceId,
        mixerType: device.mixerType,
        mixerIp: device.mixerIp,
        source: device.source,
      },
    },
  });
}

export async function agentReadSoundLevels(device: DiscoveredSoundDevice, durationMs = 150): Promise<SoundLevelsSnapshot & { success: boolean; message?: string }> {
  return proxyAudioService("/sound/levels", {
    method: "POST",
    body: {
      device: {
        id: device.id,
        deviceIndex: device.deviceIndex,
        hardwareLabel: device.hardwareLabel,
        connectionType: device.connectionType,
        browserDeviceId: device.browserDeviceId,
        mixerType: device.mixerType,
        mixerIp: device.mixerIp,
        source: device.source,
      },
      durationMs,
    },
  });
}

export async function agentSoundHealth(): Promise<{ online: boolean; message: string }> {
  return proxyAudioService("/sound/health");
}
