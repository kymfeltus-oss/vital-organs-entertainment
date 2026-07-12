import { NextResponse } from "next/server";
import { aggregateLivEnterpriseMetrics } from "@/lib/enterprise/liv-golf/aggregate-liv-enterprise-metrics";
import {
  buildLivMetricsFallbackPayload,
  wrapLivMetricsGatewayResponse,
} from "@/lib/enterprise/liv-golf/metrics-gateway";
import { countLivMicroBetPlacements } from "@/lib/enterprise/liv-golf/live-micro-bets-session";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";

export const dynamic = "force-dynamic";

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Unknown metrics gateway error";
}

/** Production metrics gateway — live ledger counts, resilient executive fallbacks. */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized access path" }, { status: 401 });
  }

  try {
    const [metrics, ticketCount] = await Promise.all([
      aggregateLivEnterpriseMetrics(),
      countLivMicroBetPlacements(),
    ]);

    const resolvedMetrics =
      ticketCount > metrics.microBetPlacements
        ? { ...metrics, microBetPlacements: ticketCount }
        : metrics;

    return NextResponse.json(wrapLivMetricsGatewayResponse(resolvedMetrics));
  } catch (error) {
    console.error("[Metrics Sub-System Connection Exception Handled]:", errorMessage(error));

    // Gracefully degrade from a hard 503 to 200 OK with baseline metrics.
    return NextResponse.json(buildLivMetricsFallbackPayload(), { status: 200 });
  }
}
