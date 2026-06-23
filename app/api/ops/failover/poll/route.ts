import { NextRequest, NextResponse } from "next/server";
import { checkPrimaryStreamHealth } from "@/lib/ops/failover-monitor";
import {
  requireOpsMetricsApiUser,
  requireOpsStreamMutationApiUser,
} from "@/lib/ops/require-ops-mutation";

function isInternalFailoverPollAuthorized(request: NextRequest): boolean {
  const adminSecret = process.env.ADMIN_SECRET_KEY?.trim();
  if (!adminSecret) return false;

  const headerSecret = request.headers.get("x-admin-secret-key")?.trim();
  if (headerSecret && headerSecret === adminSecret) return true;

  const authHeader = request.headers.get("authorization")?.trim();
  if (authHeader === `Bearer ${adminSecret}`) return true;

  return false;
}

export async function POST(request: NextRequest) {
  const internal = isInternalFailoverPollAuthorized(request);
  if (!internal) {
    const gate = await requireOpsStreamMutationApiUser(request);
    if (gate.response) {
      const metricsGate = await requireOpsMetricsApiUser(request);
      if (metricsGate.response) return metricsGate.response;
    }
  }

  try {
    const result = await checkPrimaryStreamHealth();
    return NextResponse.json(
      { success: true, ...result },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[OPS_FAILOVER_POLL_ERR]:", error);
    const message =
      error instanceof Error ? error.message : "Failover health poll failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
