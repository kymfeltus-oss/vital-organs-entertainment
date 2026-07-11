import { NextResponse } from "next/server";
import {
  LiveMicroBetsSessionUnavailableError,
  loadLiveMicroBetsSession,
} from "@/lib/enterprise/liv-golf/live-micro-bets-session";
import { findLivMicroBet, LIV_MICRO_BETS } from "@/lib/liv-micro-bets";
import { LIV_GOLF_TOUR_MAIN_ROOM } from "@/lib/live/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await loadLiveMicroBetsSession();
    const activeBetId = session?.activeBetId ?? null;
    const isActive = Boolean(activeBetId);

    return NextResponse.json({
      bets: LIV_MICRO_BETS,
      roomId: LIV_GOLF_TOUR_MAIN_ROOM,
      activeBetId,
      activeBet: findLivMicroBet(activeBetId),
      isActive,
      clearOverlays: session?.clearOverlays ?? false,
      launchedAt: session?.launchedAt ?? null,
      updatedAt: session?.updatedAt ?? null,
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
