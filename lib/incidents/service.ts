import { DEFAULT_EVENT_ID } from "@/lib/live/countdown-config";
import type {
  IncidentEvent,
  IncidentQueryParams,
  IncidentSeverity,
  IncidentSource,
  IncidentStatus,
  IncidentSummary,
} from "@/lib/incidents/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const DEFAULT_INCIDENT_TENANT_ID = DEFAULT_EVENT_ID;

type IncidentRow = {
  id: string;
  tenant_id: string;
  stream_id: string | null;
  worker_id: string | null;
  user_id: string | null;
  user_email: string | null;
  source: string;
  action: string;
  target: string;
  severity: string;
  status: string;
  description: string;
  payload_json: Record<string, unknown> | null;
  snapshot_url: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  escalated_at: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
};

function mapRow(row: IncidentRow): IncidentEvent {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    streamId: row.stream_id,
    workerId: row.worker_id,
    userId: row.user_id,
    userEmail: row.user_email,
    source: row.source as IncidentSource,
    action: row.action,
    target: row.target,
    severity: row.severity as IncidentSeverity,
    status: row.status as IncidentStatus,
    description: row.description,
    payloadJson: row.payload_json ?? {},
    snapshotUrl: row.snapshot_url,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    escalatedAt: row.escalated_at,
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at,
  };
}

function resolveDateRange(params: IncidentQueryParams): { from?: string; to?: string } {
  if (params.dateFrom || params.dateTo) {
    return { from: params.dateFrom, to: params.dateTo };
  }
  return {};
}

export async function syncStreamAccessLogsToIncidents(tenantId = DEFAULT_INCIDENT_TENANT_ID) {
  const admin = getSupabaseAdmin();

  const { data: accessLogs, error: accessError } = await admin
    .from("stream_access_logs")
    .select("id, user_id, result, reason, ip, user_agent, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (accessError || !accessLogs?.length) return;

  const { data: existing } = await admin
    .from("incident_events")
    .select("payload_json")
    .eq("tenant_id", tenantId)
    .contains("payload_json", { synced_from: "stream_access_logs" })
    .limit(1000);

  const existingIds = new Set(
    (existing ?? [])
      .map((row) => {
        const payload = row.payload_json as Record<string, unknown> | null;
        return typeof payload?.access_log_id === "string" ? payload.access_log_id : null;
      })
      .filter(Boolean),
  );

  const inserts = accessLogs
    .filter((log) => !existingIds.has(log.id))
    .map((log) => ({
      tenant_id: tenantId,
      user_id: log.user_id,
      source: "auth",
      action: log.result,
      target: log.reason,
      severity: log.result === "denied" ? "warning" : "info",
      status: "open",
      description: log.reason,
      payload_json: {
        access_log_id: log.id,
        ip: log.ip,
        user_agent: log.user_agent,
        synced_from: "stream_access_logs",
      },
      created_at: log.created_at,
    }));

  if (inserts.length === 0) return;

  await admin.from("incident_events").insert(inserts);
}

export async function listIncidents(
  tenantId: string,
  params: IncidentQueryParams,
): Promise<{ incidents: IncidentEvent[]; total: number }> {
  await syncStreamAccessLogsToIncidents(tenantId);

  const admin = getSupabaseAdmin();
  let query = admin
    .from("incident_events")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (params.severity && params.severity !== "all") {
    query = query.eq("severity", params.severity);
  }
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.source && params.source !== "all") {
    query = query.eq("source", params.source);
  }
  if (params.streamId?.trim()) {
    query = query.eq("stream_id", params.streamId.trim());
  }
  if (params.workerId?.trim()) {
    query = query.eq("worker_id", params.workerId.trim());
  }
  if (params.user?.trim()) {
    query = query.ilike("user_email", `%${params.user.trim()}%`);
  }
  if (params.action?.trim()) {
    query = query.ilike("action", `%${params.action.trim()}%`);
  }

  const { from, to } = resolveDateRange(params);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const limit = Math.min(Math.max(params.limit ?? 100, 1), 500);
  const offset = Math.max(params.offset ?? 0, 0);
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  let incidents = (data as IncidentRow[]).map(mapRow);

  if (params.search?.trim()) {
    const needle = params.search.trim().toLowerCase();
    incidents = incidents.filter((incident) => {
      const haystack = [
        incident.action,
        incident.target,
        incident.severity,
        incident.status,
        incident.userEmail,
        incident.streamId,
        incident.workerId,
        incident.source,
        incident.description,
        new Date(incident.createdAt).toLocaleString(),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }

  return { incidents, total: count ?? incidents.length };
}

export async function summarizeIncidents(
  tenantId: string,
  params: IncidentQueryParams,
): Promise<IncidentSummary> {
  const { incidents } = await listIncidents(tenantId, { ...params, limit: 500, offset: 0 });
  return {
    total: incidents.length,
    critical: incidents.filter((item) => item.severity === "critical").length,
    warning: incidents.filter((item) => item.severity === "warning").length,
    info: incidents.filter((item) => item.severity === "info").length,
  };
}

export async function getIncidentById(
  tenantId: string,
  id: string,
): Promise<IncidentEvent | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("incident_events")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRow(data as IncidentRow);
}

export async function writeAuditLog(input: {
  tenantId: string;
  userId: string;
  userEmail: string | null;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const admin = getSupabaseAdmin();
  await admin.from("audit_logs").insert({
    tenant_id: input.tenantId,
    user_id: input.userId,
    user_email: input.userEmail,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    metadata: input.metadata ?? {},
  });
}

export async function markIncidentReviewed(
  tenantId: string,
  id: string,
  userId: string,
  userEmail: string | null,
): Promise<IncidentEvent | null> {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("incident_events")
    .update({
      status: "reviewed",
      reviewed_at: now,
      reviewed_by: userId,
    })
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (data) {
    await writeAuditLog({
      tenantId,
      userId,
      userEmail,
      action: "incident.review",
      targetType: "incident_events",
      targetId: id,
    });
  }
  return data ? mapRow(data as IncidentRow) : null;
}

export async function escalateIncident(
  tenantId: string,
  id: string,
  userId: string,
  userEmail: string | null,
): Promise<IncidentEvent | null> {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("incident_events")
    .update({
      status: "escalated",
      escalated_at: now,
    })
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (data) {
    await writeAuditLog({
      tenantId,
      userId,
      userEmail,
      action: "incident.escalate",
      targetType: "incident_events",
      targetId: id,
    });
  }
  return data ? mapRow(data as IncidentRow) : null;
}

export async function resolveIncident(
  tenantId: string,
  id: string,
  userId: string,
  userEmail: string | null,
): Promise<IncidentEvent | null> {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("incident_events")
    .update({
      status: "resolved",
      resolved_at: now,
      resolved_by: userId,
    })
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (data) {
    await writeAuditLog({
      tenantId,
      userId,
      userEmail,
      action: "incident.resolve",
      targetType: "incident_events",
      targetId: id,
    });
  }
  return data ? mapRow(data as IncidentRow) : null;
}

export async function recordIncidentEvent(input: {
  tenantId?: string;
  streamId?: string | null;
  workerId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  source: IncidentSource;
  action: string;
  target: string;
  severity: IncidentSeverity;
  description?: string;
  payloadJson?: Record<string, unknown>;
  snapshotUrl?: string | null;
}) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("incident_events")
    .insert({
      tenant_id: input.tenantId ?? DEFAULT_INCIDENT_TENANT_ID,
      stream_id: input.streamId ?? null,
      worker_id: input.workerId ?? null,
      user_id: input.userId ?? null,
      user_email: input.userEmail ?? null,
      source: input.source,
      action: input.action,
      target: input.target,
      severity: input.severity,
      status: "open",
      description: input.description ?? input.target,
      payload_json: input.payloadJson ?? {},
      snapshot_url: input.snapshotUrl ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as IncidentRow);
}
