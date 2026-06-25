import { NextRequest, NextResponse } from "next/server";
import { incidentForbiddenResponse, requireIncidentApiUser } from "@/lib/incidents/auth";
import { DEFAULT_INCIDENT_TENANT_ID, markIncidentReviewed } from "@/lib/incidents/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const gate = await requireIncidentApiUser(request);
  if (gate.response || !gate.context) return gate.response;

  if (!gate.context.permissions.canReview) {
    return incidentForbiddenResponse("review incidents");
  }

  try {
    const { id } = await context.params;
    const incident = await markIncidentReviewed(
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
    console.error("[INCIDENTS_REVIEW_ERR]:", error);
    return NextResponse.json({ error: "Unable to review incident." }, { status: 500 });
  }
}
