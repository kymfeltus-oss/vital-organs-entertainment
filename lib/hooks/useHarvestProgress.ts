"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { fetchHarvestProgressCents } from "@/lib/live/harvest-metrics";
import {
  HARVEST_ACKNOWLEDGMENT_BOOTSTRAP_LIMIT,
  HARVEST_ACKNOWLEDGMENT_HISTORY_LIMIT,
  mapAcknowledgmentRow,
  type AcknowledgmentItem,
} from "@/lib/live/harvest-tiers";
import { HARVEST_METRICS_CHANNEL } from "@/lib/live/types";
import {
  buildChannelName,
  createRealtimeChannel,
  teardownRealtimeChannel,
} from "@/lib/live/realtime-subscribe";
import { getSupabase } from "@/lib/supabase/client";

const DEFAULT_GOAL_CENTS = 3_000_000;

type UseHarvestProgressResult = {
  totalCents: number;
  percentage: number;
  totalFormatted: string;
  goalFormatted: string;
  acknowledgments: AcknowledgmentItem[];
  isLoading: boolean;
  error: string | null;
};

export type { AcknowledgmentItem };

export function useHarvestProgress(
  goalAmountCents: number = DEFAULT_GOAL_CENTS,
): UseHarvestProgressResult {
  const instanceId = useId().replace(/:/g, "");
  const channelRef = useRef<Awaited<ReturnType<typeof createRealtimeChannel>> | null>(
    null,
  );

  const [totalCents, setTotalCents] = useState(0);
  const [acknowledgments, setAcknowledgments] = useState<AcknowledgmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pushAcknowledgment = useCallback((item: AcknowledgmentItem) => {
    setAcknowledgments((previous) =>
      [item, ...previous.filter((entry) => entry.id !== item.id)].slice(
        0,
        HARVEST_ACKNOWLEDGMENT_HISTORY_LIMIT,
      ),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    let supabase: ReturnType<typeof getSupabase>;
    let setupPromise: Promise<void> = Promise.resolve();

    try {
      supabase = getSupabase();
    } catch (initError) {
      console.error("Harvest progress init failed:", initError);
      queueMicrotask(() => {
        setError("Harvest analytics are unavailable.");
        setIsLoading(false);
      });
      return;
    }

    const channelName = buildChannelName(HARVEST_METRICS_CHANNEL, instanceId);

    setupPromise = (async () => {
      try {
        const [total, recentAcknowledgments] = await Promise.all([
          fetchHarvestProgressCents(supabase),
          supabase
            .from("live_acknowledgments")
            .select("id, display_name, amount_total")
            .order("created_at", { ascending: false })
            .limit(HARVEST_ACKNOWLEDGMENT_BOOTSTRAP_LIMIT),
        ]);

        if (cancelled) return;

        setTotalCents(total);

        if (!recentAcknowledgments.error && recentAcknowledgments.data) {
          setAcknowledgments(
            recentAcknowledgments.data.map((row) => mapAcknowledgmentRow(row)),
          );
        }

        setError(null);
        setIsLoading(false);

        const channel = await createRealtimeChannel(
          supabase,
          channelName,
          {
            postgres: [
              {
                event: "UPDATE",
                schema: "public",
                table: "harvest_progress",
                callback: (payload) => {
                  const row = payload.new as { total_cents?: number; id?: number };
                  if (row.id === 1 && typeof row.total_cents === "number") {
                    setTotalCents(row.total_cents);
                  }
                },
              },
              {
                event: "INSERT",
                schema: "public",
                table: "live_acknowledgments",
                callback: (payload) => {
                  const row = payload.new as {
                    id?: string;
                    display_name?: string;
                    amount_total?: number;
                  };

                  if (!row.id || !row.display_name || typeof row.amount_total !== "number") {
                    return;
                  }

                  pushAcknowledgment(
                    mapAcknowledgmentRow({
                      id: row.id,
                      display_name: row.display_name,
                      amount_total: row.amount_total,
                    }),
                  );
                },
              },
            ],
          },
          (status) => {
            if (status === "SUBSCRIBED" && !cancelled) {
              void fetchHarvestProgressCents(supabase)
                .then((nextTotal) => {
                  if (!cancelled) {
                    setTotalCents(nextTotal);
                  }
                })
                .catch(() => undefined);
            }
          },
        );

        if (cancelled) {
          await teardownRealtimeChannel(supabase, channel);
          return;
        }

        channelRef.current = channel;
      } catch (loadError) {
        console.error("Harvest progress subscribe failed:", loadError);
        if (!cancelled) {
          setError("Harvest analytics are unavailable.");
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;

      void (async () => {
        await setupPromise;
        const channel = channelRef.current;
        channelRef.current = null;
        await teardownRealtimeChannel(supabase, channel);
      })();
    };
  }, [instanceId, pushAcknowledgment]);

  const percentage = Math.min((totalCents / goalAmountCents) * 100, 100);
  const totalFormatted = (totalCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  const goalFormatted = (goalAmountCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  return {
    totalCents,
    percentage,
    totalFormatted,
    goalFormatted,
    acknowledgments,
    isLoading,
    error,
  };
}
