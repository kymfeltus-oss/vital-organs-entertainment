"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  ACKNOWLEDGMENT_HISTORY_LIMIT,
  LIVE_ACKNOWLEDGMENTS_CHANNEL,
  mapLiveAcknowledgmentRow,
  type LiveAcknowledgment,
  type LiveAcknowledgmentRow,
} from "@/lib/live/acknowledgments";
import {
  buildChannelName,
  createRealtimeChannel,
  teardownRealtimeChannel,
} from "@/lib/live/realtime-subscribe";
import { getSupabase } from "@/lib/supabase/client";

type UseLiveAcknowledgmentsResult = {
  toasts: LiveAcknowledgment[];
  dismissToast: (id: string) => void;
};

export function useLiveAcknowledgments(): UseLiveAcknowledgmentsResult {
  const instanceId = useId().replace(/:/g, "");
  const channelRef = useRef<Awaited<ReturnType<typeof createRealtimeChannel>> | null>(
    null,
  );
  const [toasts, setToasts] = useState<LiveAcknowledgment[]>([]);

  const pushToast = useCallback((acknowledgment: LiveAcknowledgment) => {
    setToasts((current) =>
      [acknowledgment, ...current.filter((entry) => entry.id !== acknowledgment.id)].slice(
        0,
        ACKNOWLEDGMENT_HISTORY_LIMIT,
      ),
    );
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((entry) => entry.id !== id));
  }, []);

  useEffect(() => {
    let cancelled = false;
    let supabase: ReturnType<typeof getSupabase>;
    let setupPromise: Promise<void> = Promise.resolve();

    try {
      supabase = getSupabase();
    } catch {
      return;
    }

    const channelName = buildChannelName(LIVE_ACKNOWLEDGMENTS_CHANNEL, instanceId);

    setupPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from("live_acknowledgments")
          .select("id, order_id, display_name, product_type, amount_total, message, created_at")
          .order("created_at", { ascending: false })
          .limit(ACKNOWLEDGMENT_HISTORY_LIMIT);

        if (!cancelled && !error && data) {
          setToasts(
            data
              .map((row) => mapLiveAcknowledgmentRow(row as LiveAcknowledgmentRow))
              .reverse(),
          );
        }

        const channel = await createRealtimeChannel(
          supabase,
          channelName,
          {
            postgres: [
              {
                event: "INSERT",
                schema: "public",
                table: "live_acknowledgments",
                callback: (payload) => {
                  if (cancelled) return;
                  const row = payload.new as LiveAcknowledgmentRow;
                  pushToast(mapLiveAcknowledgmentRow(row));
                },
              },
            ],
          },
        );

        if (cancelled) {
          await teardownRealtimeChannel(supabase, channel);
          return;
        }

        channelRef.current = channel;
      } catch (subscribeError) {
        console.error("Live acknowledgments subscribe failed:", subscribeError);
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
  }, [instanceId, pushToast]);

  return { toasts, dismissToast };
}
