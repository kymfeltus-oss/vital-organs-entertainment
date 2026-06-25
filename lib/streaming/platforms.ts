import type { StreamingPlatform } from "@/lib/streaming/types";

export type StreamingPlatformMeta = {
  id: StreamingPlatform;
  label: string;
  description: string;
  oauth: boolean;
  advanced?: boolean;
};

export const STREAMING_PLATFORMS: StreamingPlatformMeta[] = [
  {
    id: "youtube",
    label: "YouTube Live",
    description: "Stream to your church YouTube channel.",
    oauth: true,
  },
  {
    id: "facebook",
    label: "Facebook Live",
    description: "Stream to your church Facebook page.",
    oauth: true,
  },
  {
    id: "church_website",
    label: "Church Website",
    description: "Embed the livestream on your church website.",
    oauth: false,
  },
  {
    id: "vimeo",
    label: "Vimeo",
    description: "Stream through your Vimeo account.",
    oauth: true,
  },
  {
    id: "twitch",
    label: "Twitch",
    description: "Stream to your Twitch channel.",
    oauth: true,
  },
  {
    id: "custom_rtmp",
    label: "Custom Streaming Server",
    description: "For advanced setups with a custom server.",
    oauth: false,
    advanced: true,
  },
];

export function platformMeta(platform: string): StreamingPlatformMeta | undefined {
  const normalized = platform === "website" ? "church_website" : platform;
  return STREAMING_PLATFORMS.find((p) => p.id === normalized);
}

export function normalizePlatform(platform: string): StreamingPlatform | string {
  if (platform === "website" || platform === "church_online") return "church_website";
  return platform;
}
