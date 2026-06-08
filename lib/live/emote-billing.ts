import {
  FREE_SESSION_EMOTE_TAPS,
  getLiveEmote,
} from "@/lib/live/emotes";

export type EmoteBatchLine = {
  emoteId: string;
  quantity: number;
};

export type AuthoritativeEmoteBatchCost = {
  totalSeedCost: number;
  freeTapsConsumed: number;
  endingUsedFreeTaps: number;
};

/**
 * Server-side pricing: free taps apply only to basic-tier emotes, in batch order.
 * Premium emotes are always billed at full seed cost. Client billingMode is ignored.
 */
export function computeAuthoritativeEmoteBatchCost(
  batches: EmoteBatchLine[],
  startingUsedFreeTaps: number,
): AuthoritativeEmoteBatchCost {
  let usedFreeTaps = startingUsedFreeTaps;
  let totalSeedCost = 0;
  let freeTapsConsumed = 0;

  for (const batch of batches) {
    const emote = getLiveEmote(batch.emoteId);
    if (!emote) continue;

    const quantity = Math.max(0, Math.floor(batch.quantity));

    for (let index = 0; index < quantity; index += 1) {
      if (emote.tier === "basic" && usedFreeTaps < FREE_SESSION_EMOTE_TAPS) {
        usedFreeTaps += 1;
        freeTapsConsumed += 1;
      } else {
        totalSeedCost += emote.seedCost;
      }
    }
  }

  return {
    totalSeedCost,
    freeTapsConsumed,
    endingUsedFreeTaps: usedFreeTaps,
  };
}

export const MAX_EMOTE_BATCH_TOTAL_QUANTITY = 50;

export function getTotalBatchQuantity(batches: EmoteBatchLine[]): number {
  return batches.reduce(
    (sum, batch) => sum + Math.max(0, Math.floor(batch.quantity)),
    0,
  );
}
