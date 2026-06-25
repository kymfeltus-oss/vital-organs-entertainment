import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  requireServiceApiUser,
  serviceForbiddenResponse,
  type ServiceAuthContext,
} from "@/lib/todays-service/auth";
import { formatServiceApiError } from "@/lib/todays-service/migration-errors";

export async function withServiceAuth<T>(
  request: NextRequest,
  handler: (ctx: ServiceAuthContext) => Promise<T>,
  options?: { requireEdit?: boolean; requireTest?: boolean; requireBegin?: boolean },
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
  if (options?.requireBegin && !permissions.canBeginService) {
    return serviceForbiddenResponse("begin service");
  }

  try {
    const result = await handler(gate.context);
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const { message, status, technicalDetail } = formatServiceApiError(error);
    console.error("[TODAYS_SERVICE_API_ERR]:", technicalDetail);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function parseJsonBody<T extends Record<string, unknown>>(request: NextRequest): Promise<T> {
  return (await request.json()) as T;
}
