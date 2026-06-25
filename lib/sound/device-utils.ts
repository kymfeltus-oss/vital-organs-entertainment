import type { SoundLevelsSnapshot } from "@/lib/sound/types";
import type { SoundItem } from "@/lib/todays-service/types";

export function extractBrowserDeviceId(deviceId: string | null | undefined): string | null {
  if (!deviceId?.startsWith("browser://")) return null;
  return deviceId.slice("browser://".length) || null;
}

export function isBrowserSoundDevice(item: Pick<SoundItem, "deviceId" | "connectionType">): boolean {
  return Boolean(extractBrowserDeviceId(item.deviceId)) || item.connectionType === "browser_microphone";
}

export function soundItemToLevelsSnapshot(item: SoundItem): SoundLevelsSnapshot & { success: boolean; message?: string } {
  const levels = item.levelsJson ?? {};
  return {
    success: true,
    inputLevel: typeof levels.inputLevel === "number" ? levels.inputLevel : item.signalPresent ? 1 : 0,
    peak: typeof levels.peak === "number" ? levels.peak : (item.peakLevel ?? -80),
    rms: typeof levels.rms === "number" ? levels.rms : (item.averageLevel ?? -80),
    clipping: Boolean(levels.clipping ?? item.clippingDetected),
    signalPresent: Boolean(levels.signalPresent ?? item.signalPresent),
    sampleRate: item.sampleRate,
    channels: item.channelCount,
    message: "Cached levels — live metering runs in the browser.",
  };
}
