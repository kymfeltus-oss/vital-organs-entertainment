import { NextResponse } from "next/server";
import { aggregateLivEnterpriseMetrics } from "@/lib/enterprise/liv-golf/aggregate-liv-enterprise-metrics";
import { LiveMicroBetsSessionUnavailableError } from "@/lib/enterprise/liv-golf/live-micro-bets-session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const metrics = await aggregateLivEnterpriseMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    if (error instanceof LiveMicroBetsSessionUnavailableError) {
      return NextResponse.json(
        {
          error:
            "Production micro-bet session table is unavailable. Apply migration 20260711161000_live_micro_bets_session.sql.",
        },
        { status: 503 },
      );
    }

    console.error("[enterprise/liv-golf/metrics] GET failed:", error);
    return NextResponse.json({ error: "Unable to load enterprise metrics." }, { status: 500 });
  }
}
