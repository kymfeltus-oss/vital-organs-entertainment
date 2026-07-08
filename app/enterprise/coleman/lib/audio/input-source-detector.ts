import type { InputSourceMode, StageAudioDevice } from "./stage-audio-types";

const EXTERNAL_INPUT_HINTS = [
  "usb",
  "interface",
  "focusrite",
  "scarlett",
  "behringer",
  "presonus",
  "motu",
  "rme",
  "line",
  "mixer",
  "soundboard",
  "audio interface",
  "i/o",
  "dock",
  "thunderbolt",
  "firewire",
  "uac",
  "external",
];

const HEADPHONE_HINTS = [
  "headphone",
  "headset",
  "earphone",
  "airpod",
  "in-ear",
  "iems",
  "beats",
  "sony wh",
  "bose",
];

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

export function isExternalInputLabel(label: string): boolean {
  const normalized = normalizeLabel(label);
  if (!normalized || normalized === "default") {
    return false;
  }
  if (normalized.includes("built-in") || normalized.includes("internal")) {
    return false;
  }
  if (normalized.includes("microphone") && !normalized.includes("usb")) {
    return false;
  }
  return EXTERNAL_INPUT_HINTS.some((hint) => normalized.includes(hint));
}

export function isHeadphoneOutputLabel(label: string): boolean {
  const normalized = normalizeLabel(label);
  return HEADPHONE_HINTS.some((hint) => normalized.includes(hint));
}

export function classifyInputDevice(device: StageAudioDevice): InputSourceMode {
  return device.isExternal ? "directLine" : "acoustic";
}

export async function enumerateStageAudioDevices(): Promise<{
  inputs: StageAudioDevice[];
  outputs: StageAudioDevice[];
}> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
    return { inputs: [], outputs: [] };
  }

  const devices = await navigator.mediaDevices.enumerateDevices();

  const inputs: StageAudioDevice[] = devices
    .filter((device) => device.kind === "audioinput")
    .map((device) => ({
      deviceId: device.deviceId,
      label: device.label || "Microphone",
      kind: "audioinput" as const,
      isExternal: isExternalInputLabel(device.label || ""),
    }));

  const outputs: StageAudioDevice[] = devices
    .filter((device) => device.kind === "audiooutput")
    .map((device) => ({
      deviceId: device.deviceId,
      label: device.label || "Speaker",
      kind: "audiooutput" as const,
      isExternal: isHeadphoneOutputLabel(device.label || ""),
    }));

  return { inputs, outputs };
}

export function pickPreferredInput(inputs: StageAudioDevice[]): StageAudioDevice | null {
  if (inputs.length === 0) {
    return null;
  }
  const external = inputs.find((device) => device.isExternal);
  if (external) {
    return external;
  }
  return inputs.find((device) => device.deviceId === "default") ?? inputs[0];
}

export function detectHeadphonesConnected(outputs: StageAudioDevice[]): boolean {
  return outputs.some((device) => device.isExternal || isHeadphoneOutputLabel(device.label));
}
