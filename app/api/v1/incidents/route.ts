import { NextRequest, NextResponse } from "next/server";
import { incidentForbiddenResponse, requireIncidentApiUser } from "@/lib/incidents/auth";
import { parseIncidentQuery, resolvePresetDateRange } from "@/lib/incidents/query";
import { DEFAULT_INCIDENT_TENANT_ID, listIncidents, summarizeIncidents } from "@/lib/incidents/service";

function resolveQueryWindow(params: ReturnType<typeof parseIncidentQuery>) {
  if (params.datePreset && params.datePreset !== "custom") {
    return { ...params, ...resolvePresetDateRange(params.datePreset) };
  }
  return params;
}

export async function GET(request: NextRequest) {
  const gate = await requireIncidentApiUser(request);
  if (gate.response || !gate.context) return gate.response;

  if (!gate.context.permissions.canView) {
    return incidentForbiddenResponse("view incidents");
  }

  try {
    const params = resolveQueryWindow(parseIncidentQuery(request));

    const [{ incidents, total }, summary] = await Promise.all([
      listIncidents(DEFAULT_INCIDENT_TENANT_ID, params),
      summarizeIncidents(DEFAULT_INCIDENT_TENANT_ID, params),
    ]);

    return NextResponse.json(
      { incidents, summary, total },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[INCIDENTS_LIST_ERR]:", error);
    return NextResponse.json({ error: "Unable to load incidents." }, { status: 500 });
  }
}
