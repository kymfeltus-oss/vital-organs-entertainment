"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FellowshipChatMessage } from "@/lib/experience/fellowship-chat";
import { useAttendeeChatRealtime } from "@/lib/experience/useAttendeeChatRealtime";
import type { ChatTroubleCategory } from "@/lib/ops/chat-scanner";
import {
  evaluateTroubleAlert,
  nextTroubleAlertCooldownUntil,
  parseTroubleCreatedAtMs,
  pruneTroubleComplaints,
  registerTroubleComplaint,
  type TroubleComplaint,
} from "@/lib/ops/trouble-alert-engine";

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

/** Countdown production feed — realtime chat + rolling trouble popup state. */
export function useCountdownChatTroubleAlerts(
  options: UseCountdownChatTroubleAlertsOptions = {},
): UseCountdownChatTroubleAlertsResult {
  const { enabled = true } = options;
  const scannedMessageIdsRef = useRef<Set<string>>(new Set());
  const historyScannedRef = useRef(false);
  const [complaints, setComplaints] = useState<TroubleComplaint[]>([]);
  const [cooldownUntilMs, setCooldownUntilMs] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 1_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const ingestMessage = useCallback((message: FellowshipChatMessage) => {
    setComplaints((current) => {
      const createdAtMs = parseTroubleCreatedAtMs(message.createdAt);
      const result = registerTroubleComplaint(
        current,
        scannedMessageIdsRef.current,
        message.id,
        message.body,
        createdAtMs,
      );
      return result.complaints;
    });
  }, []);

  const handleMessage = useCallback(
    (message: FellowshipChatMessage) => {
      ingestMessage(message);
    },
    [ingestMessage],
  );

  const clear = useCallback(() => {
    setCooldownUntilMs(nextTroubleAlertCooldownUntil());
  }, []);

  const { messages, isLoading, isConnected } = useAttendeeChatRealtime({
    enabled,
    onMessage: handleMessage,
  });

  useEffect(() => {
    if (!enabled || isLoading || historyScannedRef.current) return;

    historyScannedRef.current = true;
    for (const message of messages) {
      ingestMessage(message);
    }
  }, [enabled, ingestMessage, isLoading, messages]);

  useEffect(() => {
    setComplaints((current) => pruneTroubleComplaints(current, nowMs));
  }, [nowMs]);

  const evaluation = useMemo(
    () => evaluateTroubleAlert(complaints, nowMs, cooldownUntilMs),
    [complaints, cooldownUntilMs, nowMs],
  );

  return {
    messages,
    isLoading,
    isConnected,
    issueType: evaluation.issueType,
    count: evaluation.count,
    audioCount: evaluation.audioCount,
    videoCount: evaluation.videoCount,
    clear,
  };
}
