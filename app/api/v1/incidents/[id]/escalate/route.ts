import { NextRequest, NextResponse } from "next/server";
import { incidentForbiddenResponse, requireIncidentApiUser } from "@/lib/incidents/auth";
import { DEFAULT_INCIDENT_TENANT_ID, escalateIncident } from "@/lib/incidents/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const gate = await requireIncidentApiUser(request);
  if (gate.response || !gate.context) return gate.response;

  if (!gate.context.permissions.canEscalate) {
    return incidentForbiddenResponse("escalate incidents");
  }

  try {
    const { id } = await context.params;
    const incident = await escalateIncident(
      DEFAULT_INCIDENT_TENANT_ID,
      id,
      gate.context.user.id,
      gate.context.user.email ?? null,
    );
    if (!incident) {
      return NextResponse.json({ error: "Incident not found." }, { status: 404 });
    }
    return NextResponse.json({ incident });
  } catch (error) {
    console.error("[INCIDENTS_ESCALATE_ERR]:", error);
    return NextResponse.json({ error: "Unable to escalate incident." }, { status: 500 });
  }
}
