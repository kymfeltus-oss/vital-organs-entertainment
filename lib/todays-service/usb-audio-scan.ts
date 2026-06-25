import type { UsbAudioDevice } from "@/lib/todays-service/mixer-connection";

const MIXER_USB_HINTS = ["behringer", "x32", "m32", "midas", "yamaha", "allen", "heath", "soundcraft", "mixer", "usb audio"];

export async function scanUsbAudioDevices(): Promise<UsbAudioDevice[]> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
    return [];
  }

  try {
    await navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      stream.getTracks().forEach((track) => track.stop());
    }).catch(() => {
      /* permission optional — labels may be empty without it */
    });
  } catch {
    /* continue with enumerate */
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter((d) => d.kind === "audioinput")
    .filter((d) => {
      const label = d.label.toLowerCase();
      return MIXER_USB_HINTS.some((hint) => label.includes(hint));
    })
    .map((d) => ({
      deviceId: d.deviceId,
      label: d.label || "USB Audio Device",
    }));
}

export function guessMixerUsbLabel(mixerChoice: string): string {
  if (mixerChoice.includes("X32")) return "Behringer X32 USB Audio";
  if (mixerChoice.includes("M32")) return "Midas M32 USB Audio";
  return `${mixerChoice || "Mixer"} USB Audio`;
}
