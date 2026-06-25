import { NextRequest } from "next/server";
import { parseJsonBody, withInternetAuth } from "@/lib/internet/route-handlers";
import { loadTodaysService, saveInternetSetup } from "@/lib/todays-service/service";
import type { InternetSetupSaveInput } from "@/lib/internet/types";

export async function POST(request: NextRequest) {
  return withInternetAuth(
    request,
    async (ctx) => {
      const body = await parseJsonBody<InternetSetupSaveInput>(request);
      if (!body.connectionName?.trim()) throw new Error("Connection name is required.");
      const result = await saveInternetSetup(ctx.tenantId, body);
      await loadTodaysService(ctx.tenantId);
      return result;
    },
    { requireEdit: true },
  );
}
