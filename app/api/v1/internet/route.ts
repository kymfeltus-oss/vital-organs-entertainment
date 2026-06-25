import { NextRequest } from "next/server";
import { parseJsonBody, withInternetAuth } from "@/lib/internet/route-handlers";
import {
  createInternetConnection,
  getOrCreateTodayService,
  listInternetConnections,
  loadTodaysService,
} from "@/lib/todays-service/service";

export async function GET(request: NextRequest) {
  return withInternetAuth(request, async (ctx) => {
    const service = await getOrCreateTodayService(ctx.tenantId);
    return { items: await listInternetConnections(service.id) };
  });
}

export async function POST(request: NextRequest) {
  return withInternetAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<{ connectionName: string; isBackup?: boolean }>(request);
      if (!body.connectionName?.trim()) throw new Error("Connection name is required.");
      const service = await getOrCreateTodayService(ctx.tenantId);
      const item = await createInternetConnection(service.id, ctx.tenantId, body);
      await loadTodaysService(ctx.tenantId);
      return { item };
    },
    { requireEdit: true },
  );
}
