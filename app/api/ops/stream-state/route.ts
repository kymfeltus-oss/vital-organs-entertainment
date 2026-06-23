import { NextRequest, NextResponse } from "next/server";
import { requireOpsMetricsApiUser } from "@/lib/ops/require-ops-mutation";
import { loadOpsStreamSnapshot } from "@/lib/ops/snapshot";

export async function GET(request: NextRequest) {
  const gate = await requireOpsMetricsApiUser(request);
  if (gate.response) return gate.response;

  try {
    const stream = await loadOpsStreamSnapshot();
    return NextResponse.json(
      { stream },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[OPS_STREAM_STATE_ERR]:", error);
    return NextResponse.json(
      { error: "Unable to load stream state." },
      { status: 500 },
    );
  }
}
