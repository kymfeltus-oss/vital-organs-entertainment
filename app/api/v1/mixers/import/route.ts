import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import { importMixerSetup, loadTodaysService } from "@/lib/todays-service/service";

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{
        mixerId?: string;
        ipAddress: string;
        mixerType?: string;
        name?: string;
        options: Record<string, boolean>;
      }>(request);
      if (!body.ipAddress?.trim()) throw new Error("Mixer IP address is required.");
      // #region agent log
      fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
        body: JSON.stringify({
          sessionId: "675ed0",
          runId: "import-fix",
          hypothesisId: "H4",
          location: "mixers/import/route.ts",
          message: "import route hit",
          data: { ip: body.ipAddress, hasOptions: Boolean(body.options) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      const result = await importMixerSetup(
        ctx.tenantId,
        {
          mixerId: body.mixerId,
          ipAddress: body.ipAddress,
          mixerType: body.mixerType,
          name: body.name,
          options: {
            channelNames: body.options?.channelNames ?? true,
            channelLabels: body.options?.channelLabels ?? true,
            userLabels: body.options?.userLabels ?? true,
            routing: body.options?.routing ?? true,
            scenes: body.options?.scenes ?? true,
            dcaGroups: body.options?.dcaGroups ?? true,
            muteGroups: body.options?.muteGroups ?? true,
          },
        },
        ctx.user.id,
        ctx.user.email ?? null,
      );
      await loadTodaysService(ctx.tenantId);
      return result;
    },
    { requireEdit: true },
  );
}
