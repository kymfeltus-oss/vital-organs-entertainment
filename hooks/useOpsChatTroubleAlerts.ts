"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ATTENDEE_CHAT_MESSAGE_EVENT,
  isAttendeeChatBroadcastPayload,
  REALTIME_ATTENDEE_CHAT_CHANNEL,
} from "@/lib/experience/attendee-chat-realtime";
import type { ChatTroubleCategory } from "@/lib/ops/chat-scanner";
import {
  evaluateTroubleAlert,
  nextTroubleAlertCooldownUntil,
  parseTroubleCreatedAtMs,
  pruneTroubleComplaints,
  registerTroubleComplaint,
  type TroubleComplaint,
} from "@/lib/ops/trouble-alert-engine";
import {
  buildChannelName,
  createRealtimeChannel,
  teardownRealtimeChannel,
} from "@/lib/live/realtime-subscribe";
import { getSupabase } from "@/lib/supabase/client";

type UseOpsChatTroubleAlertsOptions = {
  enabled?: boolean;
};

type UseOpsChatTroubleAlertsResult = {
  issueType: ChatTroubleCategory | null;
  count: number;
  audioCount: number;
  videoCount: number;
  clear: () => void;
};

/** Ops-only listener — rolling-window trouble alerts from attendee chat. */
export function useOpsChatTroubleAlerts(
  options: UseOpsChatTroubleAlertsOptions = {},
): UseOpsChatTroubleAlertsResult {
  const { enabled = true } = options;
  const instanceId = useId().replace(/:/g, "");
  const channelRef = useRef<Awaited<ReturnType<typeof createRealtimeChannel>> | null>(null);
  const scannedMessageIdsRef = useRef<Set<string>>(new Set());
  const [complaints, setComplaints] = useState<TroubleComplaint[]>([]);
  const [cooldownUntilMs, setCooldownUntilMs] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 1_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const registerTroubleMessage = useCallback(
    (messageId: string, content: string, createdAt?: string) => {
      if (!messageId) return;

      setComplaints((current) => {
        const createdAtMs = parseTroubleCreatedAtMs(createdAt);
        const result = registerTroubleComplaint(
          current,
          scannedMessageIdsRef.current,
          messageId,
          content,
          createdAtMs,
        );
        return result.complaints;
      });
    },
    [],
  );

  const clear = useCallback(() => {
    setCooldownUntilMs(nextTroubleAlertCooldownUntil());
  }, []);

  useEffect(() => {
    if (!enabled) {
      setComplaints([]);
      scannedMessageIdsRef.current.clear();
      setCooldownUntilMs(0);
      return;
    }

    let cancelled = false;
    let supabase: ReturnType<typeof getSupabase>;
    let setupPromise: Promise<void> = Promise.resolve();

    try {
      supabase = getSupabase();
    } catch (initError) {
      console.error("[OPS_CHAT_TROUBLE_ALERTS_INIT_ERR]:", initError);
      return;
    }

    const channelName = buildChannelName(REALTIME_ATTENDEE_CHAT_CHANNEL, instanceId);

    setupPromise = (async () => {
      try {
        const channel = await createRealtimeChannel(
          supabase,
          channelName,
          {
            broadcast: [
              {
                event: ATTENDEE_CHAT_MESSAGE_EVENT,
                callback: ({ payload }) => {
                  if (!isAttendeeChatBroadcastPayload(payload)) return;
                  registerTroubleMessage(payload.id, payload.content, payload.created_at);
                },
              },
            ],
            postgres: [
              {
                event: "INSERT",
                schema: "public",
                table: "chat_messages",
                callback: (payload) => {
                  const row = payload.new as {
                    id?: string;
                    content?: string;
                    created_at?: string;
                    deleted_at?: string | null;
                  };

                  if (!row.id || row.deleted_at) return;
                  registerTroubleMessage(row.id, row.content ?? "", row.created_at);
                },
              },
            ],
          },
          undefined,
          { broadcast: { self: false, ack: false } },
        );

        if (cancelled) {
          await teardownRealtimeChannel(supabase, channel);
          return;
        }

        channelRef.current = channel;
      } catch (subscribeError) {
        console.error("[OPS_CHAT_TROUBLE_ALERTS_SUBSCRIBE_ERR]:", subscribeError);
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
  }, [enabled, instanceId, registerTroubleMessage]);

  useEffect(() => {
    setComplaints((current) => pruneTroubleComplaints(current, nowMs));
  }, [nowMs]);

  const evaluation = useMemo(
    () => evaluateTroubleAlert(complaints, nowMs, cooldownUntilMs),
    [complaints, cooldownUntilMs, nowMs],
  );

  return {
    issueType: evaluation.issueType,
    count: evaluation.count,
    audioCount: evaluation.audioCount,
    videoCount: evaluation.videoCount,
    clear,
  };
}
