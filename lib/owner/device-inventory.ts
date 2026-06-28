export type DeviceKind = "MIC" | "CAMERA";
export type LinkedHub = "SOUND HUB" | "VIDEO HUB";
export type DeviceHealthStatus = "LINKED" | "DISCONNECTED" | "ERROR";

export type PersistedDevice = {
  id: string;
  displayName: string;
  deviceKind: DeviceKind;
  linkedHub: LinkedHub;
  inputChannel: number;
  manufacturer: string;
  model: string;
  sovereignIngestArn: string;
  healthStatus: DeviceHealthStatus;
  preShowActive: boolean;
  muted: boolean;
  solo: boolean;
  volume: number;
  updatedAt: string;
};

export type DeviceDraft = {
  displayName: string;
  deviceKind: DeviceKind;
  linkedHub: LinkedHub;
  inputChannel: number;
  manufacturer: string;
  model: string;
  sovereignIngestArn?: string;
  healthStatus: DeviceHealthStatus;
};

export const DEVICE_INVENTORY_STORAGE_KEY = "300-awakening-device-inventory-v1";
export const DEVICE_INVENTORY_EVENT = "300-awakening-device-inventory-updated";

export const DEFAULT_DEVICE_INVENTORY: PersistedDevice[] = [
  {
    id: "device-lead-vocal-beta-58a",
    displayName: "LEAD VOCAL (SHURE BETA 58A)",
    deviceKind: "MIC",
    linkedHub: "SOUND HUB",
    inputChannel: 1,
    manufacturer: "Shure",
    model: "Beta 58A",
    sovereignIngestArn: "arn:local:300-awakening:sound-hub:channel/1",
    healthStatus: "LINKED",
    preShowActive: false,
    muted: false,
    solo: false,
    volume: 78,
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "device-drum-overhead-c414",
    displayName: "DRUM OVERHEAD R (AKG C414)",
    deviceKind: "MIC",
    linkedHub: "SOUND HUB",
    inputChannel: 4,
    manufacturer: "AKG",
    model: "C414",
    sovereignIngestArn: "arn:local:300-awakening:sound-hub:channel/4",
    healthStatus: "LINKED",
    preShowActive: false,
    muted: false,
    solo: false,
    volume: 72,
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "device-guitar-cab-sm57",
    displayName: "GUITAR CAB (SHURE SM57)",
    deviceKind: "MIC",
    linkedHub: "SOUND HUB",
    inputChannel: 7,
    manufacturer: "Shure",
    model: "SM57",
    sovereignIngestArn: "arn:local:300-awakening:sound-hub:channel/7",
    healthStatus: "LINKED",
    preShowActive: false,
    muted: false,
    solo: false,
    volume: 70,
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "device-stage-center-sony-fx6",
    displayName: "STAGE CENTER (SONY FX6)",
    deviceKind: "CAMERA",
    linkedHub: "VIDEO HUB",
    inputChannel: 1,
    manufacturer: "Sony",
    model: "FX6",
    sovereignIngestArn: "arn:local:300-awakening:video-hub:camera/1",
    healthStatus: "LINKED",
    preShowActive: true,
    muted: false,
    solo: false,
    volume: 100,
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "device-roaming-a7siii",
    displayName: "ROAMING CAM (SONY A7SIII)",
    deviceKind: "CAMERA",
    linkedHub: "VIDEO HUB",
    inputChannel: 2,
    manufacturer: "Sony",
    model: "A7SIII",
    sovereignIngestArn: "arn:local:300-awakening:video-hub:camera/2",
    healthStatus: "LINKED",
    preShowActive: true,
    muted: false,
    solo: false,
    volume: 100,
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "device-webcam-brio",
    displayName: "WEBCAM (LOGITECH BRIO)",
    deviceKind: "CAMERA",
    linkedHub: "VIDEO HUB",
    inputChannel: 4,
    manufacturer: "Logitech",
    model: "Brio",
    sovereignIngestArn: "arn:local:300-awakening:video-hub:camera/4",
    healthStatus: "DISCONNECTED",
    preShowActive: false,
    muted: false,
    solo: false,
    volume: 100,
    updatedAt: new Date(0).toISOString(),
  },
];

export function normalizeLinkedHub(deviceKind: DeviceKind, linkedHub: LinkedHub): LinkedHub {
  if (deviceKind === "MIC") return "SOUND HUB";
  if (deviceKind === "CAMERA") return "VIDEO HUB";
  return linkedHub;
}

export function buildDeviceDisplayName(draft: Pick<DeviceDraft, "displayName" | "manufacturer" | "model">): string {
  const cleanName = draft.displayName.trim();
  const manufacturer = draft.manufacturer.trim().toUpperCase();
  const model = draft.model.trim().toUpperCase();
  if (!cleanName) return "";
  if (cleanName.includes("(")) return cleanName;
  return `${cleanName.toUpperCase()} (${manufacturer} ${model})`;
}

export function buildSovereignIngestArn(draft: Pick<DeviceDraft, "deviceKind" | "inputChannel">): string {
  const lane = draft.deviceKind === "MIC" ? "sound-hub:channel" : "video-hub:camera";
  return `arn:local:300-awakening:${lane}/${draft.inputChannel}`;
}

export function validateDeviceDraft(
  draft: DeviceDraft,
  existing: PersistedDevice[],
  editingId: string | null = null,
): string | null {
  if (!draft.displayName.trim()) return "Device name is required.";
  if (!draft.manufacturer.trim()) return "Manufacturer is required.";
  if (!draft.model.trim()) return "Model is required.";
  if (!Number.isInteger(draft.inputChannel) || draft.inputChannel < 1 || draft.inputChannel > 64) {
    return "Input channel must be a whole number from 1 to 64.";
  }
  const expectedHub = normalizeLinkedHub(draft.deviceKind, draft.linkedHub);
  if (draft.linkedHub !== expectedHub) {
    return `${draft.deviceKind} devices must route to ${expectedHub}.`;
  }
  const duplicate = existing.some(
    (device) =>
      device.id !== editingId &&
      device.linkedHub === expectedHub &&
      device.inputChannel === draft.inputChannel,
  );
  if (duplicate) {
    return `${expectedHub} channel ${draft.inputChannel} is already assigned.`;
  }
  return null;
}

export function createPersistedDevice(draft: DeviceDraft, existing: PersistedDevice[]): PersistedDevice {
  const now = new Date().toISOString();
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    displayName: buildDeviceDisplayName(draft),
    deviceKind: draft.deviceKind,
    linkedHub: normalizeLinkedHub(draft.deviceKind, draft.linkedHub),
    inputChannel: draft.inputChannel,
    manufacturer: draft.manufacturer.trim(),
    model: draft.model.trim(),
    sovereignIngestArn: draft.sovereignIngestArn?.trim() || buildSovereignIngestArn(draft),
    healthStatus: draft.healthStatus,
    preShowActive: draft.deviceKind === "CAMERA" && draft.healthStatus === "LINKED",
    muted: false,
    solo: false,
    volume: 75,
    updatedAt: now,
  };
}

export function updatePersistedDevice(
  device: PersistedDevice,
  draft: DeviceDraft,
): PersistedDevice {
  return {
    ...device,
    displayName: buildDeviceDisplayName(draft),
    deviceKind: draft.deviceKind,
    linkedHub: normalizeLinkedHub(draft.deviceKind, draft.linkedHub),
    inputChannel: draft.inputChannel,
    manufacturer: draft.manufacturer.trim(),
    model: draft.model.trim(),
    sovereignIngestArn: draft.sovereignIngestArn?.trim() || buildSovereignIngestArn(draft),
    healthStatus: draft.healthStatus,
    preShowActive:
      draft.deviceKind === "CAMERA" && draft.healthStatus === "LINKED"
        ? device.preShowActive
        : false,
    updatedAt: new Date().toISOString(),
  };
}

export function sortDevices(devices: PersistedDevice[]): PersistedDevice[] {
  return [...devices].sort((a, b) => {
    if (a.linkedHub !== b.linkedHub) return a.linkedHub.localeCompare(b.linkedHub);
    return a.inputChannel - b.inputChannel;
  });
}

export function getDevicesByKind(devices: PersistedDevice[], kind: DeviceKind): PersistedDevice[] {
  return sortDevices(devices.filter((device) => device.deviceKind === kind));
}

export function getLinkedDevicesByKind(devices: PersistedDevice[], kind: DeviceKind): PersistedDevice[] {
  return getDevicesByKind(devices, kind).filter((device) => device.healthStatus === "LINKED");
}

export function clampDeviceVolume(volume: number): number {
  if (!Number.isFinite(volume)) return 75;
  return Math.max(0, Math.min(100, Math.round(volume)));
}

export function parsePersistedDevices(raw: string | null): PersistedDevice[] {
  if (!raw) return DEFAULT_DEVICE_INVENTORY;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_DEVICE_INVENTORY;
    return parsed
      .filter((item): item is Partial<PersistedDevice> => Boolean(item && typeof item === "object"))
      .map((item, index) => {
        const kind: DeviceKind = item.deviceKind === "CAMERA" ? "CAMERA" : "MIC";
        const channel = Number.isInteger(item.inputChannel) ? item.inputChannel as number : index + 1;
        return {
          id: typeof item.id === "string" && item.id ? item.id : `device-${index + 1}`,
          displayName:
            typeof item.displayName === "string" && item.displayName
              ? item.displayName
              : `${kind} CHANNEL ${channel}`,
          deviceKind: kind,
          linkedHub: normalizeLinkedHub(kind, item.linkedHub === "VIDEO HUB" ? "VIDEO HUB" : "SOUND HUB"),
          inputChannel: channel,
          manufacturer: typeof item.manufacturer === "string" ? item.manufacturer : "Unknown",
          model: typeof item.model === "string" ? item.model : "Unknown",
          sovereignIngestArn:
            typeof item.sovereignIngestArn === "string" && item.sovereignIngestArn
              ? item.sovereignIngestArn
              : buildSovereignIngestArn({ deviceKind: kind, inputChannel: channel }),
          healthStatus:
            item.healthStatus === "DISCONNECTED" || item.healthStatus === "ERROR"
              ? item.healthStatus
              : "LINKED",
          preShowActive: Boolean(item.preShowActive),
          muted: Boolean(item.muted),
          solo: Boolean(item.solo),
          volume: clampDeviceVolume(typeof item.volume === "number" ? item.volume : 75),
          updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date(0).toISOString(),
        };
      });
  } catch {
    return DEFAULT_DEVICE_INVENTORY;
  }
}
