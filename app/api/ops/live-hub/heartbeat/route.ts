import { NextRequest, NextResponse } from "next/server";
import { getRestreamAdapterState } from "@/lib/live-hub/restream/adapter";
import { getVmixAdapterState } from "@/lib/live-hub/vmix/adapter";
import { requireOpsMetricsApiUser } from "@/lib/ops/require-ops-mutation";
import type { LiveHubHeartbeatPayload } from "@/lib/ops/live-hub-heartbeat";
import { loadOpsSnapshot } from "@/lib/ops/snapshot";
import { probeStripeHealth } from "@/lib/ops/stripe-health";

export async function GET(request: NextRequest) {
  const gate = await requireOpsMetricsApiUser(request);
  if (gate.response) return gate.response;

  try {
    const [opsSnapshot, vmixState, restreamState, stripeHealth] = await Promise.all([
      loadOpsSnapshot(),
      getVmixAdapterState(),
      getRestreamAdapterState(),
      probeStripeHealth(),
    ]);

    const payload: LiveHubHeartbeatPayload = {
      opsSnapshot,
      vmixState,
      restreamState,
      stripeHealth,
    };

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("[LIVE_HUB_HEARTBEAT_ERR]:", error);
    return NextResponse.json(
      { error: "Unable to load live hub heartbeat." },
      { status: 500 },
    );
  }
}
