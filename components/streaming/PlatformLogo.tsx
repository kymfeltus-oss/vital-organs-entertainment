"use client";

import type { StreamingPlatform } from "@/lib/streaming/types";

type PlatformLogoProps = {
  platform: string;
  className?: string;
};

function YouTubeSvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden>
      <path fill="#FF0000" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8z" />
      <path fill="#FFFFFF" d="M9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
    </svg>
  );
}

function FacebookSvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden>
      <path fill="#1877F2" d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.02 4.39 11.02 10.13 11.93v-8.44H7.08v-3.5h3.05V9.41c0-3.01 1.79-4.68 4.53-4.68 1.31 0 2.68.23 2.68.23v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87v2.25h3.32l-.53 3.5h-2.79v8.44C19.61 23.09 24 18.09 24 12.07z" />
    </svg>
  );
}

function VimeoSvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden>
      <path fill="#1AB7EA" d="M23.98 6.54c-.1 2.17-1.62 5.15-4.57 8.93-3.04 3.92-5.62 5.88-7.74 5.88-1.31 0-2.42-1.21-3.33-3.63-.61-2.23-1.23-4.46-1.86-6.69-.7-2.58-1.45-3.87-2.26-3.87-.17 0-.79.37-1.84 1.11L0 7.2c1.15-.99 2.28-1.98 3.4-2.97 1.53-1.3 2.68-1.99 3.45-2.06 1.81-.17 2.93 1.07 3.35 3.72.45 2.87.76 4.65.94 5.35.52 2.36 1.09 3.54 1.71 3.54.48 0 1.2-.76 2.16-2.28.96-1.52 1.47-2.68 1.53-3.48.14-1.32-.38-1.98-1.55-1.98-.55 0-1.12.1-1.7.31 1.13-3.69 3.28-5.49 6.74-5.41 2.46.06 3.62 1.67 3.47 4.82z" />
    </svg>
  );
}

function TwitchSvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden>
      <path fill="#9146FF" d="M11.64 5.5 9.5 5.5 9.5 8.5 7.5 8.5 7.5 5.5 5.5 5.5 5.5 2.5 2.5 2.5 2.5 14.5 5.5 14.5 5.5 11.5 7.5 11.5 7.5 14.5 9.5 14.5 9.5 11.5 11.5 11.5 11.5 14.5 13.5 14.5 13.5 11.5 15.5 11.5 15.5 8.5 17.5 8.5 17.5 5.5 19.5 5.5 19.5 2.5 16.5 2.5 16.5 5.5 14.5 5.5 14.5 8.5 12.5 8.5 12.5 5.5 11.64 5.5z" />
      <path fill="#9146FF" d="M19.5 2.5 21.5 4.5 21.5 14.5 19.5 14.5 19.5 2.5z" />
    </svg>
  );
}

function ChurchSvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden>
      <path fill="#00A8FF" d="M12 2 9 7H5v3h2v10h10V10h2V7h-4L12 2zm0 4.2L13.2 9H10.8L12 6.2z" />
    </svg>
  );
}

function RtmpSvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden>
      <path fill="#8A2EFF" d="M4 4h16v4H4V4zm0 6h10v4H4v-4zm0 6h16v4H4v-4z" />
      <circle cx="18" cy="14" r="2" fill="#FF2FAF" />
    </svg>
  );
}

export default function PlatformLogo({ platform, className = "h-10 w-10" }: PlatformLogoProps) {
  const key = platform === "church_website" ? "church" : platform === "custom_rtmp" ? "rtmp" : platform;
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40 p-1.5 ${className}`}>
      {key === "youtube" ? <YouTubeSvg /> : null}
      {key === "facebook" ? <FacebookSvg /> : null}
      {key === "vimeo" ? <VimeoSvg /> : null}
      {key === "twitch" ? <TwitchSvg /> : null}
      {key === "church" ? <ChurchSvg /> : null}
      {key === "rtmp" ? <RtmpSvg /> : null}
    </div>
  );
}

export function platformLabel(platform: StreamingPlatform | string): string {
  switch (platform) {
    case "youtube":
      return "YouTube Live";
    case "facebook":
      return "Facebook Live";
    case "church_website":
      return "Church Website";
    case "vimeo":
      return "Vimeo";
    case "twitch":
      return "Twitch";
    case "custom_rtmp":
      return "Custom RTMP";
    default:
      return String(platform);
  }
}
