import { NextResponse } from "next/server";
import {
  BetPoolExposureUnavailableError,
  loadBetPoolExposureMetrics,
} from "@/lib/enterprise/liv-golf/bet-pool-exposure";
import { evaluateRiskThreshold } from "@/lib/enterprise/liv-golf/risk-threshold";
import { LIV_GOLF_TOUR_MAIN_ROOM } from "@/lib/live/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId")?.trim() || LIV_GOLF_TOUR_MAIN_ROOM;

  try {
    const metrics = await loadBetPoolExposureMetrics(roomId);
    const alerts = metrics
      .map((row) => evaluateRiskThreshold(row))
      .filter((alert): alert is NonNullable<typeof alert> => alert !== null);

    return NextResponse.json({ roomId, metrics, alerts });
  } catch (error) {
    if (error instanceof BetPoolExposureUnavailableError) {
      return NextResponse.json(
        {
          error:
            "Production exposure metrics table is unavailable. Apply migration 20260711163000_bet_pool_exposure_metrics.sql.",
        },
        { status: 503 },
      );
    }

    console.error("[enterprise/liv-golf/risk-exposure] GET failed:", error);
    return NextResponse.json({ error: "Unable to load risk exposure metrics." }, { status: 500 });
  }
}
