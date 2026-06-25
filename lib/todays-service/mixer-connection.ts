import type { LucideIcon } from "lucide-react";
import { Globe, HelpCircle, Usb } from "lucide-react";
import type { Mixer } from "@/lib/todays-service/types";

export type MixerConnectionType = "ethernet" | "usb" | "both" | "manual" | "unknown";

export type MixerConnectionTypeChoice = "ethernet" | "usb" | "unsure";

export type ConnectionTypeOption = {
  id: MixerConnectionTypeChoice;
  title: string;
  description: string;
  footnote: string;
  recommended?: boolean;
  recommendedBadge: string;
  recommendedTooltip: string;
  Icon: LucideIcon;
};

export const CONNECTION_TYPE_OPTIONS: ConnectionTypeOption[] = [
  {
    id: "ethernet",
    title: "Ethernet Cable",
    description:
      "Best for connecting Parable to your mixer. Lets Parable find the mixer, read settings, check sound, and help manage your setup.",
    footnote: "Parable can usually find your mixer automatically.",
    recommended: true,
    recommendedBadge: "Recommended for most churches",
    recommendedTooltip:
      "Ethernet allows Parable to communicate directly with your mixer and provides the best experience.",
    Icon: Globe,
  },
  {
    id: "usb",
    title: "USB Cable",
    description:
      "Useful if your mixer is sending audio directly into the computer for recording or streaming. Some mixer controls may not be available through USB.",
    footnote: "You may still want to connect Ethernet later for full mixer control.",
    recommendedBadge: "",
    recommendedTooltip: "",
    Icon: Usb,
  },
  {
    id: "unsure",
    title: "I'm not sure",
    description: "No problem. Parable will help you figure it out.",
    footnote: "We'll automatically check both connection methods.",
    recommendedBadge: "",
    recommendedTooltip: "",
    Icon: HelpCircle,
  },
];

export const ETHERNET_SCAN_PROGRESS = [
  "Searching your network...",
  "Checking for supported mixers...",
  "Listening for mixer responses...",
] as const;

export type UsbAudioDevice = {
  deviceId: string;
  label: string;
};

export type MixerAutoCheckResult = {
  success: boolean;
  ethernetFound: boolean;
  usbFound: boolean;
  recommended: MixerConnectionTypeChoice | null;
  message: string;
  ethernetMixer?: {
    manufacturer: string;
    model: string;
    ipAddress: string;
  };
  usbDevice?: UsbAudioDevice;
};

export function mixerDisplayIp(mixer: Mixer): string {
  return mixer.ethernetIpAddress || mixer.ipAddress || "";
}

export function mixerConnectionDashboardLabel(mixer: Mixer | undefined): string {
  if (!mixer) return "Let's connect your mixer";
  switch (mixer.connectionType) {
    case "both":
      return "Mixer fully connected";
    case "ethernet":
      return "Mixer connected";
    case "usb":
      return "Mixer audio connected";
    case "manual":
      return "Mixer added manually";
    default:
      if (mixer.connectionStatus === "connected") return "Mixer connected";
      return "Let's connect your mixer";
  }
}

export function connectionTypePlainLabel(type: MixerConnectionType): string {
  switch (type) {
    case "ethernet":
      return "Ethernet";
    case "usb":
      return "USB";
    case "both":
      return "Ethernet and USB";
    case "manual":
      return "Manual";
    default:
      return "Not set up yet";
  }
}
