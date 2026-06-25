import { NextRequest } from "next/server";
import { incidentForbiddenResponse, requireIncidentApiUser } from "@/lib/incidents/auth";
import { parseIncidentQuery, resolvePresetDateRange } from "@/lib/incidents/query";
import { DEFAULT_INCIDENT_TENANT_ID, listIncidents } from "@/lib/incidents/service";

function resolveQueryWindow(params: ReturnType<typeof parseIncidentQuery>) {
  if (params.datePreset && params.datePreset !== "custom") {
    return { ...params, ...resolvePresetDateRange(params.datePreset) };
  }
  return params;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await requireIncidentApiUser(request);
  if (gate.response || !gate.context) return gate.response;

  if (!gate.context.permissions.canView) {
    return incidentForbiddenResponse("view incidents");
  }

  const encoder = new TextEncoder();
  const params = resolveQueryWindow({
    ...parseIncidentQuery(request),
    limit: 100,
    offset: 0,
  });

  let closed = false;
  request.signal.addEventListener("abort", () => {
    closed = true;
  });

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        if (closed) return;
        try {
          const { incidents, total } = await listIncidents(DEFAULT_INCIDENT_TENANT_ID, params);
          const payload = JSON.stringify({
            type: "incidents.update",
            incidents,
            total,
            at: new Date().toISOString(),
          });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch (error) {
          console.error("[INCIDENTS_LIVE_SSE_ERR]:", error);
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ message: "stream_error" })}\n\n`),
          );
        }
      };

      await send();
      const interval = setInterval(() => {
        void send();
      }, 4000);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
