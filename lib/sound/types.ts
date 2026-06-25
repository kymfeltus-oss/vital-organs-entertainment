export type SoundConnectionType =
  | "usb"
  | "ethernet_mixer"
  | "wasapi"
  | "coreaudio"
  | "asio"
  | "browser"
  | "browser_microphone"
  | "usb_audio"
  | "audio_interface"
  | "network_mixer"
  | "manual"
  | "unknown";

export type SoundLiveStatus =
  | "offline"
  | "connecting"
  | "connected"
  | "previewing"
  | "testing"
  | "needs_attention";

export type DiscoveredSoundDevice = {
  id: string;
  label: string;
  connectionType: SoundConnectionType;
  hardwareLabel?: string | null;
  deviceIndex?: number | null;
  manufacturer?: string | null;
  model?: string | null;
  sampleRate?: number | null;
  channels?: number | null;
  status?: string;
  source: string;
  browserDeviceId?: string | null;
  mixerType?: string | null;
  mixerIp?: string | null;
  /** Browser default input device */
  isDefault?: boolean;
};

export type SoundDiscoverResult = {
  devices: DiscoveredSoundDevice[];
  agentAvailable: boolean;
  message: string;
};

export type SoundTestStep = { label: string; ok: boolean };

export type SoundTestResult = {
  success: boolean;
  message: string;
  guidance?: string;
  steps?: SoundTestStep[];
  levels?: SoundLevelsSnapshot;
  sampleRate?: number | null;
  channels?: number | null;
  firmware?: string | null;
  channelCount?: number | null;
  scene?: string | null;
  health?: Record<string, unknown>;
};

export type SoundLevelsSnapshot = {
  inputLevel: number;
  peak: number;
  rms: number;
  clipping: boolean;
  signalPresent: boolean;
  sampleRate?: number | null;
  channels?: number | null;
};

export type SoundLevelsResult = SoundLevelsSnapshot & {
  success: boolean;
  message?: string;
  clientMetering?: boolean;
};

export type CreateSoundDeviceInput = {
  name: string;
  category: string;
  discoveredDeviceId: string;
  settings?: Record<string, unknown>;
};

export type UpdateSoundDeviceInput = {
  name?: string;
  category?: string;
  settings?: Record<string, unknown>;
};
