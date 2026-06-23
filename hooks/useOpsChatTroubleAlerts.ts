"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ATTENDEE_CHAT_MESSAGE_EVENT,
  isAttendeeChatBroadcastPayload,
  REALTIME_ATTENDEE_CHAT_CHANNEL,
} from "@/lib/experience/attendee-chat-realtime";
import {
  scanMessageForTrouble,
  type ChatTroubleCategory,
} from "@/lib/ops/chat-scanner";
import {
  createRealtimeChannel,
  teardownRealtimeChannel,
} from "@/lib/live/realtime-subscribe";
import { getSupabase } from "@/lib/supabase/client";

type TroubleCounts = Record<ChatTroubleCategory, number>;

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

const EMPTY_COUNTS: TroubleCounts = { audio: 0, video: 0 };

function resolveDominantIssue(counts: TroubleCounts): ChatTroubleCategory | null {
  if (counts.audio <= 0 && counts.video <= 0) return null;
  if (counts.audio >= counts.video) return "audio";
  return "video";
}

/** Ops-only listener — scans incoming attendee chat rows for audio/video trouble keywords. */
export function useOpsChatTroubleAlerts(
  options: UseOpsChatTroubleAlertsOptions = {},
): UseOpsChatTroubleAlertsResult {
  const { enabled = true } = options;
  const channelRef = useRef<Awaited<ReturnType<typeof createRealtimeChannel>> | null>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  const [counts, setCounts] = useState<TroubleCounts>(EMPTY_COUNTS);

  const registerTroubleMessage = useCallback((messageId: string, content: string) => {
    if (!messageId || seenMessageIdsRef.current.has(messageId)) return;

    const issue = scanMessageForTrouble(content);
    if (!issue) return;

    seenMessageIdsRef.current.add(messageId);
    setCounts((current) => ({
      ...current,
      [issue]: current[issue] + 1,
    }));
  }, []);

  const clear = useCallback(() => {
    setCounts(EMPTY_COUNTS);
    seenMessageIdsRef.current.clear();
  }, []);

  useEffect(() => {
    if (!enabled) {
      clear();
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

    const channelName = REALTIME_ATTENDEE_CHAT_CHANNEL;

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
                  registerTroubleMessage(payload.id, payload.content);
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
                    deleted_at?: string | null;
                  };

                  if (!row.id || row.deleted_at) return;
                  registerTroubleMessage(row.id, row.content ?? "");
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
  }, [clear, enabled, registerTroubleMessage]);

  const issueType = useMemo(() => resolveDominantIssue(counts), [counts]);
  const count = issueType ? counts[issueType] : 0;

  return {
    issueType,
    count,
    audioCount: counts.audio,
    videoCount: counts.video,
    clear,
  };
}
