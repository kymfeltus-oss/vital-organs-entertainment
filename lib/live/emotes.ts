export type LiveEmoteTier = "basic" | "premium";

export type LiveEmote = {
  id: string;
  emoji: string;
  label: string;
  tier: LiveEmoteTier;
  seedCost: number;
};

export const FREE_SESSION_EMOTE_TAPS = 3;

export const LIVE_EMOTES: readonly LiveEmote[] = [
  { id: "praise", emoji: "🙌", label: "Praise", tier: "basic", seedCost: 1 },
  { id: "fire", emoji: "🔥", label: "Fire", tier: "basic", seedCost: 1 },
  { id: "heart", emoji: "💜", label: "Love", tier: "basic", seedCost: 1 },
  { id: "wave", emoji: "👋", label: "Wave", tier: "basic", seedCost: 1 },
  { id: "sparkle", emoji: "✨", label: "Sparkle", tier: "premium", seedCost: 5 },
  { id: "golden", emoji: "🌾", label: "Golden Harvest", tier: "premium", seedCost: 10 },
  { id: "crown", emoji: "👑", label: "Crown", tier: "premium", seedCost: 10 },
] as const;

export const LIVE_EMOTE_BROADCAST_EVENT = "live-emote";
export const LIVE_EMOTE_BATCH_BROADCAST_EVENT = "live-emote-batch";

export type LiveEmoteBroadcastPayload = {
  emoteId: string;
  emoji: string;
  author: string;
  originX: number;
};

export type LiveEmoteBatchBroadcastPayload = {
  senderId: string;
  emotes: LiveEmoteBroadcastPayload[];
};

export function getLiveEmote(emoteId: string): LiveEmote | undefined {
  return LIVE_EMOTES.find((emote) => emote.id === emoteId);
}

export function resolveEmoteSeedCost(
  emote: LiveEmote,
  freeSessionTapsUsed: number,
): number {
  if (emote.tier === "premium") {
    return emote.seedCost;
  }

  if (freeSessionTapsUsed < FREE_SESSION_EMOTE_TAPS) {
    return 0;
  }

  return emote.seedCost;
}

export function formatSeedBalance(balance: number): string {
  return `🌱 ${balance.toLocaleString("en-US")} Seeds`;
}
