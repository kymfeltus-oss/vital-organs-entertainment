import type { LiveReadinessState, SectionReadiness, ReadinessStatus } from "@/lib/todays-service/types";
import type { InternetConnectionStatus } from "@/lib/internet/types";

type ReadinessInput = {
  soundItems: { status: ReadinessStatus | string }[];
  mixers: { connectionStatus: string }[];
  cameras: { status: ReadinessStatus }[];
  internetConnections: { status: InternetConnectionStatus; uploadStrength: string }[];
  streamingDestinations: { status: ReadinessStatus; connected: boolean; connectionStatus?: string; selectedForToday?: boolean }[];
  recordingSettings: { status: ReadinessStatus; recordingEnabled: boolean }[];
  presentationSources: { status: ReadinessStatus; connectionStatus: string }[];
};

function normalizeItemStatus(status: ReadinessStatus | string): ReadinessStatus {
  if (status === "connected") return "ready";
  if (status === "error") return "needs_attention";
  if (status === "unknown") return "not_connected";
  return status as ReadinessStatus;
}

function aggregateSection(items: { status: ReadinessStatus | string }[]): ReadinessStatus {
  if (items.length === 0) return "not_connected";
  const statuses = items.map((i) => normalizeItemStatus(i.status));
  if (statuses.some((s) => s === "not_connected")) return "not_connected";
  if (statuses.some((s) => s === "needs_attention")) return "needs_attention";
  if (statuses.every((s) => s === "ready")) return "ready";
  return "not_connected";
}

function scoreStatus(status: ReadinessStatus): number {
  switch (status) {
    case "ready":
      return 100;
    case "needs_attention":
      return 50;
    case "not_connected":
      return 0;
    default:
      return 0;
  }
}

export function computeSectionReadiness(input: ReadinessInput): SectionReadiness {
  const mixerStatuses: ReadinessStatus[] = input.mixers.map((m) =>
    m.connectionStatus === "connected"
      ? "ready"
      : m.connectionStatus === "needs_attention"
        ? "needs_attention"
        : "not_connected",
  );

  const soundStatuses = [...input.soundItems.map((s) => ({ status: s.status })), ...mixerStatuses.map((status) => ({ status }))];

  const internetStatuses: { status: ReadinessStatus }[] = input.internetConnections.map((c) => ({
    status: (
      c.status === "ready" || c.status === "connected"
        ? "ready"
        : c.status === "error" || c.status === "needs_attention"
          ? "needs_attention"
          : c.status === "not_connected" || c.uploadStrength === "not_connected"
            ? "not_connected"
            : c.uploadStrength === "needs_attention"
              ? "needs_attention"
              : c.uploadStrength === "excellent" || c.uploadStrength === "good"
                ? "ready"
                : "not_connected"
    ) as ReadinessStatus,
  }));

  const selectedStreams = input.streamingDestinations.filter((d) => d.selectedForToday !== false);
  const streamStatuses = (selectedStreams.length > 0 ? selectedStreams : input.streamingDestinations).map((d) => ({
    status: (
      d.connectionStatus === "ready" || (d.connected && d.status === "ready")
        ? "ready"
        : d.connectionStatus === "connected"
          ? "ready"
          : d.connectionStatus === "needs_attention" || d.connectionStatus === "error" || d.status === "needs_attention"
            ? "needs_attention"
            : d.connectionStatus === "not_connected" || !d.connected
              ? "not_connected"
              : d.status
    ) as ReadinessStatus,
  }));

  if (input.streamingDestinations.length > 0 && selectedStreams.length === 0) {
    streamStatuses.push({ status: "needs_attention" });
  }

  const recordingStatuses = input.recordingSettings.map((r) => ({
    status: r.recordingEnabled ? r.status : "ready",
  }));

  const presentationStatuses = input.presentationSources.map((p) => ({
    status:
      p.connectionStatus === "connected" && p.status === "ready"
        ? "ready"
        : p.connectionStatus === "not_connected"
          ? "not_connected"
          : p.status,
  }));

  return {
    sound: aggregateSection(soundStatuses),
    cameras: aggregateSection(input.cameras),
    internet: aggregateSection(internetStatuses),
    livestream: aggregateSection(streamStatuses),
    recording: aggregateSection(recordingStatuses),
    presentation: aggregateSection(presentationStatuses),
  };
}

export function computeReadinessPercent(sections: SectionReadiness): number {
  const values = Object.values(sections);
  const total = values.reduce((sum, status) => sum + scoreStatus(status), 0);
  return Math.round(total / values.length);
}

export function buildLiveReadinessState(
  tenantId: string,
  serviceId: string,
  input: ReadinessInput,
): LiveReadinessState {
  const sections = computeSectionReadiness(input);
  return {
    tenantId,
    serviceId,
    readinessPercent: computeReadinessPercent(sections),
    sections,
    updatedAt: new Date().toISOString(),
  };
}
