import type { StageAudioDevice } from "./stage-audio-types";
import { isHeadphoneOutputLabel } from "./input-source-detector";

export function isSinkSelectionSupported(): boolean {
  if (typeof HTMLAudioElement === "undefined") {
    return false;
  }
  return "setSinkId" in HTMLAudioElement.prototype;
}

type SinkCapableAudioContext = AudioContext & {
  setSinkId?: (sinkId: string) => Promise<void>;
};

function asSinkCapable(context: AudioContext): SinkCapableAudioContext {
  return context as SinkCapableAudioContext;
}

export function isAudioContextSinkSupported(context: AudioContext): boolean {
  return typeof asSinkCapable(context).setSinkId === "function";
}

export async function applySinkToMediaElement(
  element: HTMLMediaElement,
  sinkId: string,
): Promise<boolean> {
  if (!("setSinkId" in element) || typeof element.setSinkId !== "function") {
    return false;
  }

  try {
    await element.setSinkId(sinkId);
    return true;
  } catch {
    return false;
  }
}

export async function applySinkToAudioContext(
  context: AudioContext,
  sinkId: string,
): Promise<boolean> {
  const sinkContext = asSinkCapable(context);
  if (typeof sinkContext.setSinkId !== "function") {
    return false;
  }

  try {
    await sinkContext.setSinkId(sinkId);
    return true;
  } catch {
    return false;
  }
}

/** Prefer wired/BT IEMs and headphone-class outputs. */
export function pickHeadphoneOutput(outputs: StageAudioDevice[]): StageAudioDevice | null {
  if (outputs.length === 0) {
    return null;
  }

  const labeledHeadphone = outputs.find(
    (device) => device.isExternal || isHeadphoneOutputLabel(device.label),
  );
  if (labeledHeadphone) {
    return labeledHeadphone;
  }

  return outputs.find((device) => device.deviceId === "default") ?? outputs[0] ?? null;
}

/** Prefer built-in loudspeaker / earpiece for stage monitoring on phone. */
export function pickBuiltInSpeakerOutput(outputs: StageAudioDevice[]): StageAudioDevice | null {
  if (outputs.length === 0) {
    return null;
  }

  const builtInSpeaker = outputs.find((device) => {
    const label = device.label.toLowerCase();
    return (
      /speaker|built-in|internal|loudspeaker/i.test(label) &&
      !isHeadphoneOutputLabel(device.label)
    );
  });
  if (builtInSpeaker) {
    return builtInSpeaker;
  }

  const comms = outputs.find((device) =>
    /communication|handset|receiver|phone/i.test(device.label),
  );
  if (comms) {
    return comms;
  }

  return outputs.find((device) => !device.isExternal) ?? outputs[0] ?? null;
}

export function resolveSinkId(device: StageAudioDevice | null): string {
  if (!device?.deviceId) {
    return "";
  }
  return device.deviceId;
}
