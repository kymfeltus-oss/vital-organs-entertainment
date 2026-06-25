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
