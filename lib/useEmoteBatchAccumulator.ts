"use client";

import { useCallback, useEffect, useRef } from "react";
import { getLiveEmote, resolveEmoteSeedCost, type LiveEmote } from "@/lib/live/emotes";
import { getAppUrl } from "@/lib/useLiveEmoteFanout";

export const EMOTE_BATCH_DEBOUNCE_MS = 1_500;

export type PendingEmoteBatch = {
  emoteId: string;
  quantity: number;
  originX: number;
};

type BatchAccumulatorOptions = {
  freeSessionTapsUsed: number;
  balance: number;
  onLocalEmote: (emote: LiveEmote, originX: number) => void;
  onBalanceChange: (balance: number) => void;
  onFreeTapsUsedChange: (count: number) => void;
  onUpsellOpen: () => void;
  onError: (message: string) => void;
  disabled?: boolean;
};

function snapshotPendingBatches(
  pending: Map<string, PendingEmoteBatch>,
): PendingEmoteBatch[] {
  return Array.from(pending.values()).map((batch) => ({ ...batch }));
}

function commitSentBatches(
  pending: Map<string, PendingEmoteBatch>,
  sent: PendingEmoteBatch[],
): void {
  for (const batch of sent) {
    const existing = pending.get(batch.emoteId);
    if (!existing) continue;

    existing.quantity -= batch.quantity;

    if (existing.quantity <= 0) {
      pending.delete(batch.emoteId);
    }
  }
}

export function useEmoteBatchAccumulator({
  freeSessionTapsUsed,
  balance,
  onLocalEmote,
  onBalanceChange,
  onFreeTapsUsedChange,
  onUpsellOpen,
  onError,
  disabled = false,
}: BatchAccumulatorOptions) {
  const pendingRef = useRef<Map<string, PendingEmoteBatch>>(new Map());
  const freeTapsRef = useRef(freeSessionTapsUsed);
  const balanceRef = useRef(balance);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFlushingRef = useRef(false);

  useEffect(() => {
    freeTapsRef.current = freeSessionTapsUsed;
  }, [freeSessionTapsUsed]);

  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  const flushBatchRef = useRef<() => Promise<void>>(async () => {});

  const scheduleFlush = useCallback((delayMs = EMOTE_BATCH_DEBOUNCE_MS) => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
    }

    flushTimerRef.current = setTimeout(() => {
      void flushBatchRef.current();
    }, delayMs);
  }, []);

  const flushBatch = useCallback(async () => {
    if (isFlushingRef.current || pendingRef.current.size === 0) {
      return;
    }

    isFlushingRef.current = true;
    const batches = snapshotPendingBatches(pendingRef.current);

    let simulatedFreeTaps = freeTapsRef.current;
    let projectedBalance = balanceRef.current;

    for (const batch of batches) {
      const emote = getLiveEmote(batch.emoteId);
      if (!emote) continue;

      for (let index = 0; index < batch.quantity; index += 1) {
        const unitCost = resolveEmoteSeedCost(emote, simulatedFreeTaps);

        if (unitCost > 0 && projectedBalance < unitCost) {
          onUpsellOpen();
          isFlushingRef.current = false;
          return;
        }

        if (unitCost === 0) {
          simulatedFreeTaps += 1;
        } else {
          projectedBalance -= unitCost;
        }
      }
    }

    try {
      const response = await fetch(`${getAppUrl()}/api/live/emote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          batches: batches.map(({ emoteId, quantity, originX }) => ({
            emoteId,
            quantity,
            originX,
          })),
        }),
      });

      const data = (await response.json()) as {
        balance?: number;
        usedFreeTaps?: number;
        error?: string;
        code?: string;
      };

      if (response.status === 402 || data.code === "insufficient_seeds") {
        freeTapsRef.current = freeSessionTapsUsed;
        onUpsellOpen();
        return;
      }

      if (!response.ok) {
        freeTapsRef.current = freeSessionTapsUsed;
        onError(data.error ?? "Unable to send emotes.");
        scheduleFlush();
        return;
      }

      commitSentBatches(pendingRef.current, batches);

      if (typeof data.usedFreeTaps === "number") {
        onFreeTapsUsedChange(data.usedFreeTaps);
        freeTapsRef.current = data.usedFreeTaps;
      } else {
        onFreeTapsUsedChange(simulatedFreeTaps);
        freeTapsRef.current = simulatedFreeTaps;
      }

      if (typeof data.balance === "number") {
        onBalanceChange(data.balance);
      }

      if (pendingRef.current.size > 0) {
        scheduleFlush(0);
      }
    } catch {
      freeTapsRef.current = freeSessionTapsUsed;
      onError("Unable to send emotes. Please try again.");
      scheduleFlush();
    } finally {
      isFlushingRef.current = false;
    }
  }, [
    freeSessionTapsUsed,
    onBalanceChange,
    onError,
    onFreeTapsUsedChange,
    onUpsellOpen,
    scheduleFlush,
  ]);

  useEffect(() => {
    flushBatchRef.current = flushBatch;
  }, [flushBatch]);

  const queueEmote = useCallback(
    (emoteId: string, originX: number) => {
      if (disabled) return;

      const emote = getLiveEmote(emoteId);
      if (!emote) return;

      const unitCost = resolveEmoteSeedCost(emote, freeTapsRef.current);
      if (unitCost > 0 && balanceRef.current < unitCost) {
        onUpsellOpen();
        return;
      }

      onLocalEmote(emote, originX);

      const existing = pendingRef.current.get(emoteId);

      if (unitCost === 0) {
        freeTapsRef.current += 1;
      }

      if (existing) {
        existing.quantity += 1;
        existing.originX = originX;
      } else {
        pendingRef.current.set(emoteId, {
          emoteId,
          quantity: 1,
          originX,
        });
      }

      scheduleFlush();
    },
    [disabled, onLocalEmote, onUpsellOpen, scheduleFlush],
  );

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
      }
    };
  }, []);

  return { queueEmote };
}
