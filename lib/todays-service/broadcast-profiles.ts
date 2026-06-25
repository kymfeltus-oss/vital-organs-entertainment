export type BroadcastProfileOption = {
  name: string;
  description: string;
};

export const BROADCAST_PROFILE_OPTIONS: BroadcastProfileOption[] = [
  {
    name: "Standard",
    description: "Balanced defaults for a typical Sunday service with music and message.",
  },
  {
    name: "Gospel Worship",
    description:
      "Best for choirs, worship bands, strong vocals, preaching, and high-energy praise.",
  },
  {
    name: "Traditional Worship",
    description:
      "Best for hymns, organ, piano, choir, scripture reading, and steady camera coverage.",
  },
  {
    name: "Contemporary Worship",
    description:
      "Best for modern worship bands, lyrics, multi-camera switching, and online viewers.",
  },
  {
    name: "Speaking Only",
    description: "Best for sermons, Bible study, teaching, panels, and presentations.",
  },
  {
    name: "Conference",
    description: "Best for multiple speakers, presentations, worship sessions, and longer events.",
  },
  {
    name: "Wedding",
    description: "Best for ceremony audio, vows, music, cameras, and recording.",
  },
  {
    name: "Funeral",
    description: "Best for clear speech, quiet music, tribute videos, and respectful recording.",
  },
  {
    name: "Custom",
    description: "Use your own saved church setup.",
  },
];

export function isKnownBroadcastProfile(name: string): boolean {
  return BROADCAST_PROFILE_OPTIONS.some((option) => option.name === name);
}

export function resolveBroadcastProfileSelection(currentProfile: string): string {
  if (isKnownBroadcastProfile(currentProfile)) return currentProfile;
  return "Custom";
}
