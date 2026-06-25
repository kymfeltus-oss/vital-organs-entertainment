import { NextRequest, NextResponse } from "next/server";
import { incidentForbiddenResponse, requireIncidentApiUser } from "@/lib/incidents/auth";
import { parseIncidentQuery, resolvePresetDateRange } from "@/lib/incidents/query";
import { incidentsToCsv } from "@/lib/incidents/exportCsv";
import { DEFAULT_INCIDENT_TENANT_ID, listIncidents, writeAuditLog } from "@/lib/incidents/service";

function resolveQueryWindow(params: ReturnType<typeof parseIncidentQuery>) {
  if (params.datePreset && params.datePreset !== "custom") {
    return { ...params, ...resolvePresetDateRange(params.datePreset) };
  }
  return params;
}

const EXPORT_RATE_WINDOW_MS = 60_000;
const exportHits = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const hits = (exportHits.get(userId) ?? []).filter((ts) => now - ts < EXPORT_RATE_WINDOW_MS);
  if (hits.length >= 5) return true;
  hits.push(now);
  exportHits.set(userId, hits);
  return false;
}

export async function GET(request: NextRequest) {
  const gate = await requireIncidentApiUser(request);
  if (gate.response || !gate.context) return gate.response;

  if (!gate.context.permissions.canExport) {
    return incidentForbiddenResponse("export incidents");
  }

  if (isRateLimited(gate.context.user.id)) {
    return NextResponse.json({ error: "Export rate limit exceeded." }, { status: 429 });
  }

  try {
    const params = resolveQueryWindow({
      ...parseIncidentQuery(request),
      limit: 500,
      offset: 0,
    });

    const { incidents } = await listIncidents(DEFAULT_INCIDENT_TENANT_ID, params);
    const csv = incidentsToCsv(incidents);

    await writeAuditLog({
      tenantId: DEFAULT_INCIDENT_TENANT_ID,
      userId: gate.context.user.id,
      userEmail: gate.context.user.email ?? null,
      action: "incident.export",
      targetType: "incident_events",
      metadata: { count: incidents.length, filters: params },
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="incident-logs-${Date.now()}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[INCIDENTS_EXPORT_ERR]:", error);
    return NextResponse.json({ error: "Unable to export incidents." }, { status: 500 });
  }
}
