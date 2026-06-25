export const INCIDENT_SEVERITIES = ["critical", "warning", "info"] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const INCIDENT_STATUSES = ["open", "reviewed", "escalated", "resolved"] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const INCIDENT_SOURCES = [
  "console",
  "preshow",
  "camera",
  "worker",
  "ffmpeg",
  "destination",
  "recording",
  "auth",
  "system",
  "api_gateway",
] as const;
export type IncidentSource = (typeof INCIDENT_SOURCES)[number];

/** UI mock / client-side incident row */
export type Incident = {
  id: string;
  time: string;
  user: string;
  action: string;
  target: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  streamId: string;
  tenantId: string;
  workerId: string;
  description: string;
  payload: Record<string, unknown>;
  snapshots: string[];
};

/** PostgreSQL-backed incident event (API layer) */
export type IncidentEvent = {
  id: string;
  tenantId: string;
  streamId: string | null;
  workerId: string | null;
  userId: string | null;
  userEmail: string | null;
  source: IncidentSource;
  action: string;
  target: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  payloadJson: Record<string, unknown>;
  snapshotUrl: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  escalatedAt: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
};

export type IncidentSummaryCounts = {
  total: number;
  critical: number;
  warning: number;
  info: number;
};

export type IncidentSummary = IncidentSummaryCounts;

export type DateRangePreset = "today" | "24h" | "7d" | "30d" | "custom";

export type IncidentAdvancedFilters = {
  severity: IncidentSeverity | "all";
  status: IncidentStatus | "all";
  source: IncidentSource | "all";
  user: string;
  action: string;
  dateFrom: string;
  dateTo: string;
  streamId: string;
  workerId: string;
};

export const DEFAULT_INCIDENT_FILTERS: IncidentAdvancedFilters = {
  severity: "all",
  status: "all",
  source: "all",
  user: "",
  action: "",
  dateFrom: "",
  dateTo: "",
  streamId: "",
  workerId: "",
};

export type IncidentQueryParams = {
  severity?: IncidentSeverity | "all";
  status?: IncidentStatus | "all";
  source?: IncidentSource | "all";
  user?: string;
  action?: string;
  search?: string;
  streamId?: string;
  workerId?: string;
  dateFrom?: string;
  dateTo?: string;
  datePreset?: string;
  limit?: number;
  offset?: number;
};

export type IncidentListResponse = {
  incidents: IncidentEvent[];
  summary: IncidentSummary;
  total: number;
};

export type IncidentRbacRole = "owner" | "admin" | "producer" | "viewer";

export type IncidentPermissions = {
  role: IncidentRbacRole;
  canView: boolean;
  canExport: boolean;
  canReview: boolean;
  canEscalate: boolean;
  canResolve: boolean;
};

export type IncidentConnectionState = "live" | "reconnecting" | "disconnected";
