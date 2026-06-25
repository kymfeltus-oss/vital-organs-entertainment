import { NextRequest } from "next/server";
import { withSoundAuth } from "@/lib/sound/route-handlers";
import { readSavedSoundLevels } from "@/lib/sound/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return withSoundAuth(
    request,
    async (ctx) => readSavedSoundLevels(id, ctx.tenantId),
    { requireTest: true },
  );
}
