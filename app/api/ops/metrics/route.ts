import { NextResponse } from "next/server";
import { requireOpsAdminApiUser } from "@/lib/ops/assert-ops-admin";
import { loadOpsSnapshot } from "@/lib/ops/snapshot";

export async function GET() {
  const gate = await requireOpsAdminApiUser();
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
