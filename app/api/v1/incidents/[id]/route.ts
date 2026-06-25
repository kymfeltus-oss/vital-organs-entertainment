import { NextRequest, NextResponse } from "next/server";
import { incidentForbiddenResponse, requireIncidentApiUser } from "@/lib/incidents/auth";
import { DEFAULT_INCIDENT_TENANT_ID, getIncidentById } from "@/lib/incidents/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const gate = await requireIncidentApiUser(request);
  if (gate.response || !gate.context) return gate.response;

  if (!gate.context.permissions.canView) {
    return incidentForbiddenResponse("view incidents");
  }

  try {
    const { id } = await context.params;
    const incident = await getIncidentById(DEFAULT_INCIDENT_TENANT_ID, id);
    if (!incident) {
      return NextResponse.json({ error: "Incident not found." }, { status: 404 });
    }
    return NextResponse.json({ incident });
  } catch (error) {
    console.error("[INCIDENTS_GET_ERR]:", error);
    return NextResponse.json({ error: "Unable to load incident." }, { status: 500 });
  }
}
