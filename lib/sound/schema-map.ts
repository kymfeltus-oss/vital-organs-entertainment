import type { SoundLevelsSnapshot } from "@/lib/sound/types";
import type { SoundCategory, SoundDeviceConnectionType, SoundDeviceStatus, SoundDeviceType } from "@/lib/todays-service/types";
import type { SoundConnectionType } from "@/lib/sound/types";

export function mapDiscoveredConnectionType(connectionType: string): SoundDeviceConnectionType {
  switch (connectionType) {
    case "browser":
    case "browser_microphone":
      return "browser_microphone";
    case "usb":
    case "wasapi":
    case "coreaudio":
    case "usb_audio":
      return "usb_audio";
    case "asio":
    case "audio_interface":
      return "audio_interface";
    case "ethernet_mixer":
    case "network_mixer":
      return "network_mixer";
    case "manual":
      return "manual";
    default:
      return "unknown";
  }
}

export function mapCategoryToDeviceType(category: string): SoundDeviceType {
  switch (category) {
    case "mixer":
      return "mixer";
    case "choir_mic":
      return "choir_group";
    case "band_input":
      return "band_group";
    case "other":
      return "manual";
    case "microphone":
    case "pastor_mic":
    case "livestream_audio":
    case "recording_audio":
      return "microphone";
    default:
      return "microphone";
  }
}

export function mapTestToDeviceStatus(success: boolean, signalPresent?: boolean): SoundDeviceStatus {
  if (!success) return signalPresent === false ? "needs_attention" : "error";
  return "ready";
}

export function levelsToDbFields(levels?: SoundLevelsSnapshot | Record<string, unknown> | null) {
  const peak = typeof levels?.peak === "number" ? levels.peak : null;
  const rms = typeof levels?.rms === "number" ? levels.rms : null;
  const signalPresent = Boolean(levels?.signalPresent);
  const clipping = Boolean(levels?.clipping);
  return {
    signalPresent,
    peakLevel: peak,
    averageLevel: rms,
    clippingDetected: clipping,
    levelsJson: (levels as Record<string, unknown>) ?? {},
  };
}

export function connectionLabel(connectionType: string): string {
  switch (connectionType) {
    case "browser_microphone":
    case "browser":
      return "Browser Microphone";
    case "usb_audio":
    case "usb":
    case "wasapi":
    case "coreaudio":
      return "USB Audio";
    case "audio_interface":
    case "asio":
      return "Audio Interface";
    case "network_mixer":
    case "ethernet_mixer":
      return "Network Mixer";
    case "manual":
      return "Manual";
    default:
      return "Audio Device";
  }
}

export function mapPersistedConnectionType(connectionType: string): SoundConnectionType {
  switch (connectionType) {
    case "browser_microphone":
      return "browser";
    case "network_mixer":
      return "ethernet_mixer";
    case "usb_audio":
      return "usb";
    case "audio_interface":
      return "asio";
    default:
      return connectionType as SoundConnectionType;
  }
}

/** Legacy category kept for forms; maps to device_type on save. */
export function deviceTypeToCategory(deviceType: SoundDeviceType): SoundCategory {
  switch (deviceType) {
    case "mixer":
      return "mixer";
    case "choir_group":
      return "choir_mic";
    case "band_group":
    case "instrument_input":
      return "band_input";
    case "manual":
      return "other";
    default:
      return "microphone";
  }
}
