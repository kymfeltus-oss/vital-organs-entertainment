import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logInternetError, sanitizeInternetError } from "@/lib/internet/errors";
import {
  requireServiceApiUser,
  serviceForbiddenResponse,
  type ServiceAuthContext,
} from "@/lib/todays-service/auth";

export async function withInternetAuth<T>(
  request: NextRequest,
  handler: (ctx: ServiceAuthContext) => Promise<T>,
  options?: { requireEdit?: boolean; requireTest?: boolean },
): Promise<NextResponse> {
  const gate = await requireServiceApiUser(request);
  if (gate.response || !gate.context) return gate.response;

  const { permissions } = gate.context;
  if (!permissions.canView) {
    return serviceForbiddenResponse("view internet setup");
  }
  if (options?.requireEdit && !permissions.canEdit) {
    return serviceForbiddenResponse("edit internet setup");
  }
  if (options?.requireTest && !permissions.canTest) {
    return serviceForbiddenResponse("run internet tests");
  }

  try {
    const result = await handler(gate.context);
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    logInternetError(`${request.method} ${request.nextUrl.pathname}`, error);
    const message = sanitizeInternetError(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export { parseJsonBody } from "@/lib/todays-service/route-handlers";
