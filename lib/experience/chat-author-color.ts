const CHAT_AUTHOR_COLORS = [
  "exp-chat-name-blue",
  "exp-chat-name-magenta",
  "exp-chat-name-cyan",
] as const;

/** Stable mockup accent per attendee for Twitch-style chat names. */
export function chatAuthorColorClass(seed: string): string {
  if (!seed) return CHAT_AUTHOR_COLORS[0];

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash + seed.charCodeAt(index) * (index + 3)) % CHAT_AUTHOR_COLORS.length;
  }

  return CHAT_AUTHOR_COLORS[hash] ?? CHAT_AUTHOR_COLORS[0];
}
