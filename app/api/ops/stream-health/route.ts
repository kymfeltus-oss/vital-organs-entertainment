import { NextRequest, NextResponse } from "next/server";
import { checkPrimaryStreamHealth } from "@/lib/ops/failover-monitor";
import {
  requireOpsMetricsApiUser,
  requireOpsStreamMutationApiUser,
} from "@/lib/ops/require-ops-mutation";

function isInternalStreamHealthAuthorized(request: NextRequest): boolean {
  const adminSecret = process.env.ADMIN_SECRET_KEY?.trim();
  if (!adminSecret) return false;

  const headerSecret = request.headers.get("x-admin-secret-key")?.trim();
  if (headerSecret && headerSecret === adminSecret) return true;

  const authHeader = request.headers.get("authorization")?.trim();
  if (authHeader === `Bearer ${adminSecret}`) return true;

  return false;
}

export async function POST(request: NextRequest) {
  const internal = isInternalStreamHealthAuthorized(request);
  if (!internal) {
    const gate = await requireOpsStreamMutationApiUser(request);
    if (gate.response) {
      const metricsGate = await requireOpsMetricsApiUser(request);
      if (metricsGate.response) return metricsGate.response;
    }
  }

  try {
    const result = await checkPrimaryStreamHealth();

    if (result.action === "healthy") {
      return NextResponse.json(
        {
          success: true,
          status: "healthy",
          bitrate: result.bitrate,
          isPublishing: result.isPublishing,
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    if (result.action === "skipped") {
      return NextResponse.json(
        {
          success: true,
          status: "skipped",
          reason: result.reason,
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    return NextResponse.json(
      {
        success: true,
        status:
          result.trigger === "crash"
            ? "failover_triggered_crash"
            : "failover_triggered_inactive",
        backupPlaybackUrl: result.backupPlaybackUrl,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[OPS_STREAM_HEALTH_ERR]:", error);
    const message =
      error instanceof Error ? error.message : "Stream health validation failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
