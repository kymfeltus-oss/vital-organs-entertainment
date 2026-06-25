import { NextRequest, NextResponse } from "next/server";
import { requireServiceApiUser } from "@/lib/todays-service/auth";
import { completeStreamingOAuth } from "@/lib/streaming/service";
import { loadTodaysService } from "@/lib/todays-service/service";

type RouteContext = { params: Promise<{ provider: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { provider } = await context.params;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!code || !state) {
    return NextResponse.redirect(`${base}/dashboard/todays-service?streaming=error`);
  }

  let destinationId = "";
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as { destinationId?: string };
    destinationId = parsed.destinationId ?? "";
  } catch {
    destinationId = "";
  }

  const redirectBack = destinationId
    ? `${base}/dashboard/todays-service?streaming=connected&destinationId=${encodeURIComponent(destinationId)}&wizardStep=stream-info`
    : `${base}/dashboard/todays-service?streaming=connected`;

  const gate = await requireServiceApiUser(request);
  if (!gate.context) {
    return NextResponse.redirect(`${base}/login?next=/dashboard/todays-service`);
  }

  try {
    await completeStreamingOAuth(
      gate.context.tenantId,
      provider,
      code,
      state,
      gate.context.user.id,
      gate.context.user.email ?? null,
    );
    await loadTodaysService(gate.context.tenantId);
    return NextResponse.redirect(redirectBack);
  } catch {
    return NextResponse.redirect(`${base}/dashboard/todays-service?streaming=error`);
  }
}
