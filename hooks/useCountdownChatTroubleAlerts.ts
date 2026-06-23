"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FellowshipChatMessage } from "@/lib/experience/fellowship-chat";
import { useAttendeeChatRealtime } from "@/lib/experience/useAttendeeChatRealtime";
import {
  scanMessageForTrouble,
  type ChatTroubleCategory,
} from "@/lib/ops/chat-scanner";

type TroubleCounts = Record<ChatTroubleCategory, number>;

type UseCountdownChatTroubleAlertsOptions = {
  enabled?: boolean;
};

type UseCountdownChatTroubleAlertsResult = {
  messages: FellowshipChatMessage[];
  isLoading: boolean;
  isConnected: boolean;
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

function debugLog(hypothesisId: string, message: string, data: Record<string, unknown>) {
  // #region agent log
  fetch("http://127.0.0.1:7924/ingest/91e1e0f3-2fd3-4620-91fc-790155003627", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "ac75e2" },
    body: JSON.stringify({
      sessionId: "ac75e2",
      runId: "post-fix",
      hypothesisId,
      location: "useCountdownChatTroubleAlerts.ts",
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

/** Countdown production feed — `realtime_attendee_chat` + keyword trouble popup state. */
export function useCountdownChatTroubleAlerts(
  options: UseCountdownChatTroubleAlertsOptions = {},
): UseCountdownChatTroubleAlertsResult {
  const { enabled = true } = options;
  const scannedMessageIdsRef = useRef<Set<string>>(new Set());
  const historyScannedRef = useRef(false);
  const [counts, setCounts] = useState<TroubleCounts>(EMPTY_COUNTS);

  const registerTroubleMessage = useCallback((message: FellowshipChatMessage, source: string) => {
    if (scannedMessageIdsRef.current.has(message.id)) return;

    const issue = scanMessageForTrouble(message.body);
    scannedMessageIdsRef.current.add(message.id);

    if (!issue) return;

    debugLog("H5", "trouble keyword matched", {
      source,
      issue,
      messageId: message.id,
      bodyPreview: message.body.slice(0, 80),
    });

    setCounts((current) => ({
      ...current,
      [issue]: current[issue] + 1,
    }));
  }, []);

  const handleMessage = useCallback(
    (message: FellowshipChatMessage) => {
      registerTroubleMessage(message, "realtime");
    },
    [registerTroubleMessage],
  );

  const clear = useCallback(() => {
    setCounts(EMPTY_COUNTS);
    scannedMessageIdsRef.current.clear();
    historyScannedRef.current = false;
  }, []);

  const { messages, isLoading, isConnected } = useAttendeeChatRealtime({
    enabled,
    onMessage: handleMessage,
  });

  useEffect(() => {
    if (!enabled || isLoading || historyScannedRef.current) return;

    historyScannedRef.current = true;
    debugLog("H5", "scanning loaded chat history", { messageCount: messages.length });

    for (const message of messages) {
      registerTroubleMessage(message, "history");
    }
  }, [enabled, isLoading, messages, registerTroubleMessage]);

  const issueType = useMemo(() => resolveDominantIssue(counts), [counts]);
  const count = issueType ? counts[issueType] : 0;

  useEffect(() => {
    if (!issueType || count <= 0) return;
    debugLog("H5", "trouble popup state active", { issueType, count });
  }, [count, issueType]);

  return {
    messages,
    isLoading,
    isConnected,
    issueType,
    count,
    audioCount: counts.audio,
    videoCount: counts.video,
    clear,
  };
}
