import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  requireServiceApiUser,
  serviceForbiddenResponse,
  type ServiceAuthContext,
} from "@/lib/todays-service/auth";
import { toUserFacingSoundError } from "@/lib/sound/errors";

export async function withSoundAuth<T>(
  request: NextRequest,
  handler: (ctx: ServiceAuthContext) => Promise<T>,
  options?: { requireEdit?: boolean; requireTest?: boolean; successStatus?: number },
): Promise<NextResponse> {
  const gate = await requireServiceApiUser(request);
  if (gate.response || !gate.context) return gate.response;

  const { permissions } = gate.context;
  if (!permissions.canView) {
    return serviceForbiddenResponse("view today's service");
  }
  if (options?.requireEdit && !permissions.canEdit) {
    return serviceForbiddenResponse("edit today's service");
  }
  if (options?.requireTest && !permissions.canTest) {
    return serviceForbiddenResponse("run tests");
  }

  try {
    const result = await handler(gate.context);
    const status = options?.successStatus ?? 200;
    return NextResponse.json(result, { status, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[SOUND_API_ERR]:", error);
    return NextResponse.json({ error: toUserFacingSoundError(error) }, { status: 500 });
  }
}
