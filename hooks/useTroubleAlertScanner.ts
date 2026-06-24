"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeAttendeeChatRow, TroubleAlert } from "@/lib/broadcast/countdown-console-types";
import { TROUBLE_ALERT_COPY } from "@/lib/broadcast/countdown-console-types";
import {
  evaluateTroubleAlert,
  nextTroubleAlertCooldownUntil,
  parseTroubleCreatedAtMs,
  pruneTroubleComplaints,
  registerTroubleComplaint,
  type TroubleComplaint,
} from "@/lib/ops/trouble-alert-engine";

type UseTroubleAlertScannerResult = {
  activeAlert: TroubleAlert | null;
  clearAlert: () => void;
};

/** Scan attendee chat rows for rolling audio/video complaint alerts. */
export function useTroubleAlertScanner(
  messages: RealtimeAttendeeChatRow[],
): UseTroubleAlertScannerResult {
  const scannedIdsRef = useRef<Set<string>>(new Set());
  const [complaints, setComplaints] = useState<TroubleComplaint[]>([]);
  const [cooldownUntilMs, setCooldownUntilMs] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 1_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setComplaints((current) => {
      let next = current;
      for (const row of messages) {
        const body = row.message ?? "";
        if (!body.trim()) continue;
        const createdAtMs = parseTroubleCreatedAtMs(row.created_at);
        const result = registerTroubleComplaint(
          next,
          scannedIdsRef.current,
          row.id,
          body,
          createdAtMs,
        );
        next = result.complaints;
      }
      return next;
    });
  }, [messages]);

  useEffect(() => {
    setComplaints((current) => pruneTroubleComplaints(current, nowMs));
  }, [nowMs]);

  const evaluation = useMemo(
    () => evaluateTroubleAlert(complaints, nowMs, cooldownUntilMs),
    [complaints, cooldownUntilMs, nowMs],
  );

  const activeAlert = useMemo((): TroubleAlert | null => {
    if (!evaluation.issueType) return null;
    const copy = TROUBLE_ALERT_COPY[evaluation.issueType];
    return {
      type: evaluation.issueType,
      count: evaluation.count,
      message: copy.message,
      fix: copy.fix,
    };
  }, [evaluation.count, evaluation.issueType]);

  const clearAlert = useCallback(() => {
    setCooldownUntilMs(nextTroubleAlertCooldownUntil());
  }, []);

  return { activeAlert, clearAlert };
}
