const CHAT_AUTHOR_COLORS = [
  "text-brand-blue",
  "text-brand-pink",
  "text-brand-purple",
] as const;

/** Stable brand accent per attendee for Twitch-style chat names. */
export function chatAuthorColorClass(seed: string): string {
  if (!seed) return CHAT_AUTHOR_COLORS[0];

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash + seed.charCodeAt(index) * (index + 3)) % CHAT_AUTHOR_COLORS.length;
  }

  return CHAT_AUTHOR_COLORS[hash] ?? CHAT_AUTHOR_COLORS[0];
}
