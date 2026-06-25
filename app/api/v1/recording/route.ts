import { NextRequest } from "next/server";
import { parseJsonBody, withServiceAuth } from "@/lib/todays-service/route-handlers";
import {
  getOrCreateTodayService,
  listRecordingSettings,
  loadTodaysService,
  upsertRecordingSetting,
} from "@/lib/todays-service/service";

export async function GET(request: NextRequest) {
  return withServiceAuth(request, async (ctx) => {
    const service = await getOrCreateTodayService(ctx.tenantId);
    return { items: await listRecordingSettings(service.id) };
  });
}

export async function POST(request: NextRequest) {
  return withServiceAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<Record<string, unknown>>(request);
      const service = await getOrCreateTodayService(ctx.tenantId);
      const item = await upsertRecordingSetting(service.id, ctx.tenantId, body as Parameters<typeof upsertRecordingSetting>[2]);
      await loadTodaysService(ctx.tenantId);
      return { item };
    },
    { requireEdit: true },
  );
}
