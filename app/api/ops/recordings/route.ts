import { NextRequest, NextResponse } from "next/server";
import { listPastBroadcastRecordings } from "@/lib/ops/past-broadcast-recordings";
import { requireOpsMetricsApiUser } from "@/lib/ops/require-ops-mutation";

export async function GET(request: NextRequest) {
  const gate = await requireOpsMetricsApiUser(request);
  if (gate.response) return gate.response;

  try {
    const limitParam = request.nextUrl.searchParams.get("limit");
    const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : 24;
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 100)
      : 24;

    const recordings = await listPastBroadcastRecordings(limit);

    return NextResponse.json(
      { recordings },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[OPS_RECORDINGS_LIST_ERR]:", error);
    return NextResponse.json(
      { error: "Unable to load past broadcast recordings." },
      { status: 500 },
    );
  }
}
