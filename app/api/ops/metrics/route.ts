import { NextRequest, NextResponse } from "next/server";
import { requireOpsMetricsApiUser } from "@/lib/ops/require-ops-mutation";
import { loadOpsSnapshot } from "@/lib/ops/snapshot";

export async function GET(request: NextRequest) {
  const gate = await requireOpsMetricsApiUser(request);
  if (gate.response) return gate.response;

  try {
    const snapshot = await loadOpsSnapshot();
    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[OPS_METRICS_ERR]:", error);
    return NextResponse.json(
      { error: "Unable to load operations metrics." },
      { status: 500 },
    );
  }
}
