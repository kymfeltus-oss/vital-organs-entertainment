import type { ProductionLogEntry } from "@/services/broadcast/ProductionLogService";
import type {
  AdapterConnectionMeta,
  ProductionState,
  StreamTelemetry,
  VmixAdapterHealthMeta,
} from "@/lib/broadcast/types";

export type PostEventReportInput = {
  productionLog: ProductionLogEntry[];
  /** Optional end-of-session snapshot — not required for core log summary. */
  production?: Pick<ProductionState, "isRecording" | "isLive">;
  streamTelemetry?: StreamTelemetry;
  mediaCore?: AdapterConnectionMeta;
  vmixHealth?: VmixAdapterHealthMeta;
};

export type PostEventRepeatedIssue = {
  label: string;
  count: number;
};

export type PostEventReport = {
  generatedAt: string;
  sessionStartedAt: string | null;
  sessionEndedAt: string | null;
  totalEventDurationMs: number | null;
  totalEventDurationLabel: string;
  warningCount: number;
  criticalFailureCount: number;
  hardBlockCount: number;
  goLiveAt: string | null;
  stopLiveAt: string | null;
  recordingStatus: "active" | "off" | "unknown";
  topRepeatedIssues: PostEventRepeatedIssue[];
  distributionHealthSummary: string;
  mediaCoreHealthSummary: string;
};

const TOP_ISSUE_LIMIT = 5;

function formatDuration(ms: number): string {
  if (ms < 0) return "—";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function chronological(entries: ProductionLogEntry[]): ProductionLogEntry[] {
  return [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

function issueKey(entry: ProductionLogEntry): string {
  if (entry.metadata?.ruleId) return entry.metadata.ruleId;
  if (entry.metadata?.command === "go_live" && entry.severity === "black") {
    return "go_live_blocked";
  }
  const base = entry.message.split("→")[0]?.trim() ?? entry.message;
  return base.toLowerCase();
}

function issueLabel(key: string, entry: ProductionLogEntry): string {
  if (entry.metadata?.ruleId) {
    return entry.message.split("→")[0]?.trim() || entry.message;
  }
  return entry.message.split("→")[0]?.trim() || entry.message;
}

function findGoLiveTimestamp(entries: ProductionLogEntry[]): string | null {
  const hit = chronological(entries).find(
    (entry) =>
      entry.phase === "command" &&
      entry.metadata?.command === "go_live" &&
      entry.severity !== "black",
  );
  return hit?.timestamp ?? null;
}

function findStopLiveTimestamp(entries: ProductionLogEntry[]): string | null {
  const hits = chronological(entries).filter(
    (entry) =>
      entry.phase === "command" && entry.metadata?.command === "stop_live",
  );
  return hits.at(-1)?.timestamp ?? null;
}

function countBySeverity(entries: ProductionLogEntry[]) {
  let warningCount = 0;
  let criticalFailureCount = 0;
  let hardBlockCount = 0;

  for (const entry of entries) {
    if (entry.severity === "yellow" || entry.severity === "orange") {
      warningCount += 1;
    } else if (entry.severity === "red") {
      criticalFailureCount += 1;
    } else if (entry.severity === "black") {
      hardBlockCount += 1;
    }
  }

  return { warningCount, criticalFailureCount, hardBlockCount };
}

function summarizeTopRepeatedIssues(entries: ProductionLogEntry[]): PostEventRepeatedIssue[] {
  const counts = new Map<string, { label: string; count: number }>();

  for (const entry of entries) {
    if (entry.severity === "green" && entry.phase === "log") continue;
    const key = issueKey(entry);
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    counts.set(key, { label: issueLabel(key, entry), count: 1 });
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, TOP_ISSUE_LIMIT);
}

function summarizeDistributionHealth(stream?: StreamTelemetry): string {
  if (!stream) {
    return "Distribution telemetry unavailable — review production log for stream warnings.";
  }

  const connected = stream.destinations.filter((dest) => dest.connected).length;
  const live = stream.destinations.filter((dest) => dest.live).length;
  const total = stream.destinations.length;
  const loss = stream.packetLossPercent.toFixed(1);

  if (!stream.pipelineAvailable) {
    return "Distribution pipeline was unavailable at session end.";
  }

  if (total === 0) {
    return `Uplink ${stream.internetStatus}; no distribution endpoints registered.`;
  }

  return `${connected}/${total} endpoints connected · ${live} live · ${stream.bitrateKbps} kbps · ${loss}% packet loss · uplink ${stream.internetStatus}.`;
}

function summarizeMediaCoreHealth(
  mediaCore?: AdapterConnectionMeta,
  vmixHealth?: VmixAdapterHealthMeta,
): string {
  if (vmixHealth) {
    const latency =
      vmixHealth.pollLatencyMs !== null ? `${vmixHealth.pollLatencyMs}ms poll` : "poll n/a";
    const inputs = `${vmixHealth.inputCount} source(s)`;
    if (vmixHealth.status === "connected") {
      return `Media Core connected · ${latency} · ${inputs}.`;
    }
    if (vmixHealth.status === "degraded") {
      return `Media Core degraded · ${latency} · ${inputs}${vmixHealth.lastError ? ` · ${vmixHealth.lastError}` : ""}.`;
    }
    return `Media Core disconnected${vmixHealth.lastError ? ` · ${vmixHealth.lastError}` : ""}.`;
  }

  if (!mediaCore) {
    return "Media Core telemetry unavailable — review production log for adapter warnings.";
  }

  if (mediaCore.connectionState === "connected" && mediaCore.isAvailable && !mediaCore.lastError) {
    return "Media Core connected at session end.";
  }

  if (mediaCore.lastError) {
    return `Media Core ${mediaCore.connectionState} · ${mediaCore.lastError}.`;
  }

  return `Media Core ${mediaCore.connectionState} at session end.`;
}

function resolveRecordingStatus(
  production?: Pick<ProductionState, "isRecording" | "isLive">,
): PostEventReport["recordingStatus"] {
  if (!production) return "unknown";
  return production.isRecording ? "active" : "off";
}

/** Read-only post-event summary — invoke after session end, never on the live hydrate loop. */
export function generatePostEventReport(input: PostEventReportInput): PostEventReport {
  const entries = input.productionLog ?? [];
  const ordered = chronological(entries);
  const sessionStartedAt = ordered[0]?.timestamp ?? null;
  const sessionEndedAt = ordered.at(-1)?.timestamp ?? null;
  const goLiveAt = findGoLiveTimestamp(entries);
  const stopLiveAt = findStopLiveTimestamp(entries);

  let totalEventDurationMs: number | null = null;
  if (goLiveAt && stopLiveAt) {
    totalEventDurationMs = new Date(stopLiveAt).getTime() - new Date(goLiveAt).getTime();
  } else if (sessionStartedAt && sessionEndedAt) {
    totalEventDurationMs =
      new Date(sessionEndedAt).getTime() - new Date(sessionStartedAt).getTime();
  }

  const { warningCount, criticalFailureCount, hardBlockCount } = countBySeverity(entries);

  return {
    generatedAt: new Date().toISOString(),
    sessionStartedAt,
    sessionEndedAt,
    totalEventDurationMs,
    totalEventDurationLabel:
      totalEventDurationMs !== null ? formatDuration(totalEventDurationMs) : "—",
    warningCount,
    criticalFailureCount,
    hardBlockCount,
    goLiveAt,
    stopLiveAt,
    recordingStatus: resolveRecordingStatus(input.production),
    topRepeatedIssues: summarizeTopRepeatedIssues(entries),
    distributionHealthSummary: summarizeDistributionHealth(input.streamTelemetry),
    mediaCoreHealthSummary: summarizeMediaCoreHealth(input.mediaCore, input.vmixHealth),
  };
}

export class PostEventReportService {
  generate(input: PostEventReportInput): PostEventReport {
    return generatePostEventReport(input);
  }
}

export const postEventReportService = new PostEventReportService();
