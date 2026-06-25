import { NextRequest, NextResponse } from "next/server";
import { requireServiceApiUser } from "@/lib/todays-service/auth";
import { startStreamingOAuth } from "@/lib/streaming/service";

type RouteContext = { params: Promise<{ provider: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { provider } = await context.params;
  const destinationId = request.nextUrl.searchParams.get("destinationId");
  if (!destinationId) {
    return NextResponse.json({ error: "destinationId is required." }, { status: 400 });
  }

  const gate = await requireServiceApiUser(request);
  if (!gate.context || gate.response) {
    return gate.response ?? NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await startStreamingOAuth(gate.context.tenantId, provider, destinationId);
    if (result.authorizationUrl) {
      return NextResponse.redirect(result.authorizationUrl);
    }
    return NextResponse.json(result, { status: 503 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth start failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
