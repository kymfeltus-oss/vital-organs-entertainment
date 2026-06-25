import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Clock,
  Gauge,
  Layers,
  Radio,
  Settings,
  SlidersHorizontal,
  Volume2,
  Waves,
  Zap,
} from "lucide-react";

export type AudioNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

export const AUDIO_NAV_ITEMS: AudioNavItem[] = [
  { id: "operations", label: "Audio Operations", href: "/dashboard/audio", icon: Radio },
  { id: "x32", label: "X32 Overview", href: "/dashboard/audio/x32", icon: SlidersHorizontal },
  { id: "channels", label: "Input Channels", href: "/dashboard/audio/channels", icon: Volume2 },
  { id: "buses", label: "Buses and Outputs", href: "/dashboard/audio/buses", icon: Layers },
  { id: "effects", label: "Effects Rack", href: "/dashboard/audio/effects", icon: Zap },
  { id: "scenes", label: "Scenes", href: "/dashboard/audio/scenes", icon: Activity },
  { id: "snapshots", label: "Snapshots", href: "/dashboard/audio/snapshots", icon: Gauge },
  { id: "health", label: "Audio Health", href: "/dashboard/audio/health", icon: Activity },
  { id: "incidents", label: "Incident Logs", href: "/dashboard/audio/incidents", icon: AlertTriangle },
  { id: "feedback", label: "Feedback Monitor", href: "/dashboard/audio/feedback", icon: Waves },
  { id: "loudness", label: "Loudness Monitor", href: "/dashboard/audio/loudness", icon: Gauge },
  { id: "delay", label: "Delay Monitor", href: "/dashboard/audio/delay", icon: Clock },
  { id: "settings", label: "Settings", href: "/dashboard/audio/settings", icon: Settings },
];

export const AUDIO_TOP_TABS = [
  { label: "Overview", href: "/dashboard/audio" },
  { label: "Mixer", href: "/dashboard/audio/channels" },
  { label: "Channels", href: "/dashboard/audio/channels" },
  { label: "Effects", href: "/dashboard/audio/effects" },
  { label: "Scenes", href: "/dashboard/audio/scenes" },
  { label: "Routing", href: "/dashboard/audio/buses" },
  { label: "Snapshots", href: "/dashboard/audio/snapshots" },
  { label: "Incidents", href: "/dashboard/audio/incidents" },
  { label: "Analytics", href: "/dashboard/audio/loudness" },
  { label: "Settings", href: "/dashboard/audio/settings" },
] as const;

export function findAudioNavItem(pathname: string): AudioNavItem | null {
  for (const item of AUDIO_NAV_ITEMS) {
    if (pathname === item.href || (item.href !== "/dashboard/audio" && pathname.startsWith(`${item.href}/`))) {
      return item;
    }
    if (item.href === "/dashboard/audio" && pathname === "/dashboard/audio") {
      return item;
    }
  }
  return null;
}
