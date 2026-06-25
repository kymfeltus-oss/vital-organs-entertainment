import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { saveStreamingWizardProfile } from "@/lib/streaming/service";
import type { StreamingWizardSaveInput } from "@/lib/streaming/types";

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<StreamingWizardSaveInput>(request);
      if (!body.destinationId) throw new Error("destinationId is required.");
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/90113a7b-b2ce-449d-9c16-dbf632e3c139", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
        body: JSON.stringify({
          sessionId: "675ed0",
          runId: "wizard-save",
          hypothesisId: "H-wizard-missing-columns",
          location: "wizard/save/route.ts:POST",
          message: "wizard save request",
          data: {
            destinationId: body.destinationId,
            markReady: Boolean(body.markReady),
            hasVideoProfile: body.videoProfile != null,
            hasNetworkTest: body.networkTest != null,
            hasScheduledStartAt: body.scheduledStartAt != null,
            scheduledStartAt: body.scheduledStartAt ?? null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => undefined);
      // #endregion
      const item = await saveStreamingWizardProfile(
        ctx.tenantId,
        ctx.user.id,
        ctx.user.email ?? null,
        body,
      );
      return { item };
    },
    { requireEdit: true },
  );
}
