"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getClientAppUrl } from "@/lib/client-api";
import type { FellowshipChatMessage } from "@/lib/experience/fellowship-chat";
import { scanMessageForTrouble } from "@/lib/ops/chat-scanner";
import { useOpsChatTroubleAlerts } from "@/hooks/useOpsChatTroubleAlerts";
import { useOpsStreamStateRealtime } from "@/hooks/useOpsStreamStateRealtime";
import {
  buildProductionAlerts,
  buildProductionMetricCards,
  buildSystemHealthRows,
  buildTelemetryRows,
  type AttendeeRecentMessage,
  type ProductionAlert,
  type ProductionMetric,
  type SystemHealthRow,
  type TelemetryRow,
} from "@/lib/ops/production-dashboard-metrics";
import type { OpsSnapshot } from "@/lib/ops/types";
import { roleLabel, isOpsTeamRole, type OpsTeamRole } from "@/lib/ops/team-roles";

const METRICS_POLL_MS = 30_000;
const HISTORY_MAX = 24;

export type ProductionDashboardMetrics = {
  stream: OpsSnapshot["stream"] | null;
  opsState: ReturnType<typeof useOpsStreamStateRealtime>["opsState"];
  metrics: ProductionMetric[];
  telemetryRows: TelemetryRow[];
  alerts: ProductionAlert[];
  systemHealth: SystemHealthRow[];
  latencyHistory: number[];
  droppedHistory: number[];
  role: OpsTeamRole;
  roleDisplay: string;
  lastUpdated: string | null;
  telemetryRevision: string;
  lastRefreshedAt: Date | null;
  isRefreshing: boolean;
  isLive: boolean;
  paidAttendees: number;
  recentChatCount10m: number;
  troubleCount: number;
  audioIssueCount: number;
  videoIssueCount: number;
  recentMessages: AttendeeRecentMessage[];
  refresh: () => Promise<void>;
};

function mapRelevantRecentMessages(messages: FellowshipChatMessage[]): AttendeeRecentMessage[] {
  return messages
    .filter((message) => scanMessageForTrouble(message.body))
    .slice(-5)
    .reverse()
    .map((message) => ({
      id: message.id,
      author: message.author,
      body: message.body,
      createdAt: message.createdAt,
    }));
}

function ingestTroubleMessages(
  messages: FellowshipChatMessage[],
  ingestMessage: (messageId: string, content: string, createdAt?: string) => void,
): void {
  for (const message of messages) {
    ingestMessage(message.id, message.body, message.createdAt);
  }
}

function resolveInitials(email: string): string {
  const local = email.split("@")[0] ?? "OP";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

export function useProductionDashboardMetrics(operatorEmail: string): ProductionDashboardMetrics & {
  profileInitials: string;
} {
  const { stream, opsState, refreshStream } = useOpsStreamStateRealtime();
  const trouble = useOpsChatTroubleAlerts({ enabled: true, realtime: false });

  const [snapshot, setSnapshot] = useState<OpsSnapshot | null>(null);
  const [role, setRole] = useState<OpsTeamRole>("admin");
  const [recentMessages, setRecentMessages] = useState<AttendeeRecentMessage[]>([]);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollRef = useRef<number | undefined>(undefined);
  const latencyHistoryRef = useRef<number[]>([]);
  const droppedHistoryRef = useRef<number[]>([]);
  const lastTelemetrySampleRef = useRef<string>("");

  const isLive = opsState?.isLive === true;
  const uptime = opsState?.uptime ?? "";
  const latencySeconds = opsState?.latencySeconds ?? 0;
  const droppedFramesPercent = opsState?.droppedFramesPercent ?? 0;

  if (isLive) {
    const sampleKey = `${uptime}|${latencySeconds}|${droppedFramesPercent}`;
    if (sampleKey !== lastTelemetrySampleRef.current) {
      lastTelemetrySampleRef.current = sampleKey;
      latencyHistoryRef.current = [...latencyHistoryRef.current, latencySeconds].slice(
        -HISTORY_MAX,
      );
      droppedHistoryRef.current = [...droppedHistoryRef.current, droppedFramesPercent].slice(
        -HISTORY_MAX,
      );
    }
  } else if (lastTelemetrySampleRef.current !== "") {
    lastTelemetrySampleRef.current = "";
    latencyHistoryRef.current = [];
    droppedHistoryRef.current = [];
  }

  const latencyHistory = latencyHistoryRef.current;
  const droppedHistory = droppedHistoryRef.current;

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [metricsResponse, roleResponse, chatResponse] = await Promise.all([
        fetch(`${getClientAppUrl()}/api/ops/metrics`, {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/ops/crew-role", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch(`${getClientAppUrl()}/api/experience/fellowship-chat`, {
          credentials: "include",
          cache: "no-store",
        }),
        refreshStream(),
      ]);

      if (metricsResponse.ok) {
        const data = (await metricsResponse.json()) as OpsSnapshot;
        setSnapshot(data);
      }

      if (roleResponse.ok) {
        const data = (await roleResponse.json()) as { role?: string };
        if (isOpsTeamRole(data.role)) setRole(data.role);
      }

      if (chatResponse.ok) {
        const data = (await chatResponse.json()) as { messages?: FellowshipChatMessage[] };
        const messages = data.messages ?? [];
        ingestTroubleMessages(messages, trouble.ingestMessage);
        setRecentMessages(mapRelevantRecentMessages(messages));
      }

      setLastRefreshedAt(new Date());
    } catch (error) {
      console.error("[PRODUCTION_DASHBOARD_REFRESH_ERR]:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshStream, trouble.ingestMessage]);

  useEffect(() => {
    void refresh();
    pollRef.current = window.setInterval(() => {
      void refresh();
    }, METRICS_POLL_MS);
    return () => {
      if (pollRef.current !== undefined) window.clearInterval(pollRef.current);
    };
  }, [refresh]);

  const metrics = useMemo(
    () => buildProductionMetricCards(stream, opsState),
    [stream, opsState],
  );
  const telemetryRows = useMemo(
    () => buildTelemetryRows(stream, opsState),
    [stream, opsState],
  );
  const alerts = useMemo(
    () => buildProductionAlerts(stream, opsState),
    [stream, opsState],
  );
  const systemHealth = useMemo(
    () => buildSystemHealthRows(stream, opsState),
    [stream, opsState],
  );

  const lastUpdated = stream?.updatedAt ?? snapshot?.stream.updatedAt ?? null;
  const telemetryRevision = isLive
    ? `${uptime}|${latencySeconds}|${droppedFramesPercent}`
    : "";

  return {
    stream,
    opsState,
    metrics,
    telemetryRows,
    alerts,
    systemHealth,
    latencyHistory,
    droppedHistory,
    role,
    roleDisplay: roleLabel(role),
    lastUpdated,
    telemetryRevision,
    lastRefreshedAt,
    isRefreshing,
    isLive: opsState?.isLive === true,
    paidAttendees: snapshot?.metrics.paidAttendees ?? 0,
    recentChatCount10m: snapshot?.realtime.recentChatMessages10m ?? 0,
    troubleCount: trouble.windowComplaintCount,
    audioIssueCount: trouble.windowAudioCount,
    videoIssueCount: trouble.windowVideoCount,
    recentMessages,
    refresh,
    profileInitials: resolveInitials(operatorEmail),
  };
}
