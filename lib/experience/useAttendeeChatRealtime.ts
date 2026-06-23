"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ATTENDEE_CHAT_MESSAGE_EVENT,
  isAttendeeChatBroadcastPayload,
  REALTIME_ATTENDEE_CHAT_CHANNEL,
  type AttendeeChatBroadcastPayload,
} from "@/lib/experience/attendee-chat-realtime";
import {
  mapFellowshipChatRow,
  mergeFellowshipMessages,
  type FellowshipChatMessage,
  type FellowshipChatMessageRow,
  type FellowshipChatPayload,
} from "@/lib/experience/fellowship-chat";
import {
  createRealtimeChannel,
  teardownRealtimeChannel,
} from "@/lib/live/realtime-subscribe";
import { getClientAppUrl } from "@/lib/client-api";
import { getSupabase } from "@/lib/supabase/client";

const POLL_FALLBACK_MS = 15_000;
const MONITOR_HISTORY_LIMIT = 40;

type UseAttendeeChatRealtimeOptions = {
  enabled?: boolean;
  /** Fires for each newly received message (broadcast or postgres). */
  onMessage?: (message: FellowshipChatMessage) => void;
};

type UseAttendeeChatRealtimeResult = {
  messages: FellowshipChatMessage[];
  isLoading: boolean;
  isConnected: boolean;
};

function mapBroadcastPayload(payload: AttendeeChatBroadcastPayload): FellowshipChatMessage {
  return mapFellowshipChatRow({
    id: payload.id,
    user_id: payload.user_id,
    email: payload.email,
    content: payload.content,
    created_at: payload.created_at,
    is_pinned: false,
    deleted_at: null,
  } as FellowshipChatMessageRow);
}

function mergeHistory(
  current: FellowshipChatMessage[],
  history: FellowshipChatMessage[],
): FellowshipChatMessage[] {
  return history
    .reduce(
      (accumulator, message) => mergeFellowshipMessages(accumulator, message),
      current,
    )
    .slice(-MONITOR_HISTORY_LIMIT);
}

function debugLog(hypothesisId: string, message: string, data: Record<string, unknown>) {
  // #region agent log
  fetch("http://127.0.0.1:7924/ingest/91e1e0f3-2fd3-4620-91fc-790155003627", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "ac75e2" },
    body: JSON.stringify({
      sessionId: "ac75e2",
      runId: "post-fix",
      hypothesisId,
      location: "useAttendeeChatRealtime.ts",
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

/** Subscribe to native `realtime_attendee_chat` + hydrate from Fellowship Chat API. */
export function useAttendeeChatRealtime(
  options: UseAttendeeChatRealtimeOptions = {},
): UseAttendeeChatRealtimeResult {
  const { enabled = true, onMessage } = options;
  const channelRef = useRef<Awaited<ReturnType<typeof createRealtimeChannel>> | null>(null);
  const syncAbortRef = useRef<AbortController | null>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const onMessageRef = useRef(onMessage);

  onMessageRef.current = onMessage;

  const [messages, setMessages] = useState<FellowshipChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [usePollingFallback, setUsePollingFallback] = useState(false);

  const ingestMessage = useCallback((message: FellowshipChatMessage, source: string) => {
    if (seenMessageIdsRef.current.has(message.id)) return;
    seenMessageIdsRef.current.add(message.id);

    setMessages((current) =>
      mergeFellowshipMessages(current, message).slice(-MONITOR_HISTORY_LIMIT),
    );
    debugLog("H2-H3", "chat message ingested", {
      source,
      messageId: message.id,
      bodyPreview: message.body.slice(0, 80),
    });
    onMessageRef.current?.(message);
  }, []);

  const syncFeed = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    syncAbortRef.current?.abort();
    const abortController = new AbortController();
    syncAbortRef.current = abortController;

    try {
      const response = await fetch(`${getClientAppUrl()}/api/experience/fellowship-chat`, {
        cache: "no-store",
        credentials: "include",
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) return;

      if (!response.ok) {
        throw new Error(`feed unavailable (${response.status})`);
      }

      const payload = (await response.json()) as FellowshipChatPayload;
      if (abortController.signal.aborted) return;

      const history = payload.messages
        .filter((message) => !message.isPinned)
        .slice(-MONITOR_HISTORY_LIMIT);

      setMessages((current) => {
        const merged = mergeHistory(current, history);
        seenMessageIdsRef.current = new Set(merged.map((message) => message.id));
        return merged;
      });

      debugLog("H1", "chat history synced", {
        historyCount: history.length,
        status: response.status,
      });

      setUsePollingFallback(false);
    } catch (syncError) {
      if (
        abortController.signal.aborted ||
        (syncError instanceof DOMException && syncError.name === "AbortError") ||
        (syncError instanceof Error && syncError.name === "AbortError")
      ) {
        return;
      }
      console.error("Attendee chat realtime sync failed:", syncError);
      debugLog("H1", "chat history sync failed", {
        error: syncError instanceof Error ? syncError.message : "unknown",
      });
      setUsePollingFallback(true);
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    return () => {
      syncAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setMessages([]);
      seenMessageIdsRef.current.clear();
      setIsLoading(false);
      setIsConnected(false);
      return;
    }

    setIsLoading(true);
    void syncFeed();
  }, [enabled, syncFeed]);

  useEffect(() => {
    if (!enabled || !usePollingFallback) return;

    const intervalId = window.setInterval(() => {
      void syncFeed();
    }, POLL_FALLBACK_MS);

    return () => window.clearInterval(intervalId);
  }, [enabled, syncFeed, usePollingFallback]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let supabase: ReturnType<typeof getSupabase>;
    let setupPromise: Promise<void> = Promise.resolve();

    try {
      supabase = getSupabase();
    } catch (initError) {
      console.error("Attendee chat realtime init failed:", initError);
      debugLog("H4", "supabase init failed", {
        error: initError instanceof Error ? initError.message : "unknown",
      });
      setUsePollingFallback(true);
      setIsConnected(false);
      return;
    }

    setupPromise = (async () => {
      try {
        const channel = await createRealtimeChannel(
          supabase,
          REALTIME_ATTENDEE_CHAT_CHANNEL,
          {
            broadcast: [
              {
                event: ATTENDEE_CHAT_MESSAGE_EVENT,
                callback: ({ payload }) => {
                  if (!isAttendeeChatBroadcastPayload(payload)) {
                    debugLog("H3", "broadcast payload rejected", {
                      payloadType: typeof payload,
                    });
                    return;
                  }
                  ingestMessage(mapBroadcastPayload(payload), "broadcast");
                },
              },
            ],
            postgres: [
              {
                event: "INSERT",
                schema: "public",
                table: "chat_messages",
                callback: (payload) => {
                  const row = payload.new as FellowshipChatMessageRow;
                  if (row.deleted_at || row.is_pinned) return;
                  ingestMessage(mapFellowshipChatRow(row), "postgres");
                },
              },
              {
                event: "UPDATE",
                schema: "public",
                table: "chat_messages",
                callback: () => {
                  void syncFeed();
                },
              },
            ],
          },
          (status) => {
            if (cancelled) return;
            setIsConnected(status === "SUBSCRIBED");
            debugLog("H4", "realtime channel status", { status });
          },
          { broadcast: { self: false, ack: false } },
        );

        if (cancelled) {
          await teardownRealtimeChannel(supabase, channel);
          return;
        }

        channelRef.current = channel;
        setUsePollingFallback(false);
      } catch (subscribeError) {
        console.error("Attendee chat realtime subscribe failed:", subscribeError);
        debugLog("H4", "realtime subscribe failed", {
          error: subscribeError instanceof Error ? subscribeError.message : "unknown",
        });
        if (!cancelled) {
          setUsePollingFallback(true);
          setIsConnected(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      setIsConnected(false);
      void (async () => {
        await setupPromise;
        const channel = channelRef.current;
        channelRef.current = null;
        await teardownRealtimeChannel(supabase, channel);
      })();
    };
  }, [enabled, ingestMessage, syncFeed]);

  return {
    messages,
    isLoading,
    isConnected,
  };
}
