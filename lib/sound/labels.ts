export { connectionLabel as soundConnectionLabel } from "@/lib/sound/schema-map";

export const SOUND_CONNECTION_LABELS: Record<string, string> = {
  browser_microphone: "Browser Microphone",
  browser: "Browser Microphone",
  usb_audio: "USB Audio",
  usb: "USB Audio",
  wasapi: "Windows Audio (WASAPI)",
  coreaudio: "macOS Core Audio",
  audio_interface: "Audio Interface",
  asio: "ASIO",
  network_mixer: "Network Mixer",
  ethernet_mixer: "Ethernet Mixer",
  manual: "Manual",
  unknown: "Audio Device",
};
