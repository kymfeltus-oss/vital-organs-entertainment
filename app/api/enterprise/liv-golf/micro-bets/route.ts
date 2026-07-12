import { NextResponse } from "next/server";
import {
  LiveMicroBetsSessionUnavailableError,
  loadLiveMicroBetsSession,
} from "@/lib/enterprise/liv-golf/live-micro-bets-session";
import { findLivMicroBet, LIV_MICRO_BETS_CATALOG, LIV_MICRO_BETS, toActiveBet, toLiveMicroBetPayload } from "@/lib/liv-micro-bets";
import { LEGENDARY_SHOWCASE_SCENARIOS } from "@/lib/enterprise/liv-golf/legendary-showcase-scenarios";
import { LIV_GOLF_TOUR_MAIN_ROOM } from "@/lib/live/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await loadLiveMicroBetsSession();
    const activeBetId = session?.activeBetId ?? null;
    const isActive = Boolean(activeBetId);

    const activeBet = findLivMicroBet(activeBetId);

    return NextResponse.json({
      bets: LIV_MICRO_BETS_CATALOG.map(toActiveBet),
      catalog: LIV_MICRO_BETS_CATALOG,
      showcaseScenarios: LEGENDARY_SHOWCASE_SCENARIOS,
      productionBets: LIV_MICRO_BETS.map(toActiveBet),
      roomId: LIV_GOLF_TOUR_MAIN_ROOM,
      activeBetId,
      activeBet: activeBet ? toLiveMicroBetPayload(activeBet, isActive) : null,
      isActive,
      clearOverlays: session?.clearOverlays ?? false,
      launchedAt: session?.launchedAt ?? null,
      updatedAt: session?.updatedAt ?? null,
      phase: session?.phase ?? "OPEN",
      endsAt: session?.endsAt ?? null,
      resolvedWinner: session?.resolvedWinner ?? null,
    });
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

    console.error("[enterprise/liv-golf/micro-bets] GET failed:", error);
    return NextResponse.json({ error: "Unable to load micro-bet session." }, { status: 500 });
  }
}
