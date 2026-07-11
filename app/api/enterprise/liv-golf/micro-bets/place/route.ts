import { NextRequest, NextResponse } from "next/server";
import {
  LiveMicroBetsSessionUnavailableError,
  loadLiveMicroBetsSession,
} from "@/lib/enterprise/liv-golf/live-micro-bets-session";
import { LIV_MICRO_BET_TRANSACTION_TYPE, findLivMicroBet } from "@/lib/liv-micro-bets";
import { resolveAuthenticatedBuyer } from "@/lib/checkout/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PlaceBetBody = {
  betId?: unknown;
  selection?: unknown;
};

type DeductSeedWalletResult = {
  balance?: number;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAuthenticatedBuyer(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Sign in to place a bet." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as PlaceBetBody;
    const betId = typeof body.betId === "string" ? body.betId.trim() : "";
    const selection = body.selection;

    if (!betId || (selection !== "Yes" && selection !== "No")) {
      return auth.withSessionCookies(
        NextResponse.json({ success: false, message: "Invalid bet payload." }, { status: 400 }),
      );
    }

    const bet = findLivMicroBet(betId);
    if (!bet) {
      return auth.withSessionCookies(
        NextResponse.json({ success: false, message: "Bet is not available." }, { status: 404 }),
      );
    }

    const session = await loadLiveMicroBetsSession();
    if (!session || session.activeBetId !== betId) {
      return auth.withSessionCookies(
        NextResponse.json({ success: false, message: "This bet is not currently live." }, { status: 409 }),
      );
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin.rpc("deduct_seed_wallet", {
      p_user_id: auth.buyer.userId,
      p_cost: bet.stake,
      p_transaction_type: LIV_MICRO_BET_TRANSACTION_TYPE,
      p_description: `LIV micro-bet: ${bet.question} → ${selection}`,
      p_reference_id: null,
    });

    if (error) {
      const message = error.message.toLowerCase().includes("insufficient")
        ? "Insufficient LIV Fan Token balance."
        : error.message;

      return auth.withSessionCookies(
        NextResponse.json({ success: false, message }, { status: 400 }),
      );
    }

    const result = data as DeductSeedWalletResult | number | null;
    const balance =
      typeof result === "number"
        ? result
        : typeof result === "object" && result && typeof result.balance === "number"
          ? result.balance
          : null;

    return auth.withSessionCookies(
      NextResponse.json({
        success: true,
        balance,
        payout: bet.payout,
        selection,
        message: `Bet locked on ${selection}. Potential payout: ${bet.payout} tokens.`,
      }),
    );
  } catch (error) {
    if (error instanceof LiveMicroBetsSessionUnavailableError) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Production micro-bet session table is unavailable. Apply migration 20260711161000_live_micro_bets_session.sql.",
        },
        { status: 503 },
      );
    }

    console.error("[enterprise/liv-golf/micro-bets/place] POST failed:", error);
    return NextResponse.json({ success: false, message: "Unable to place bet." }, { status: 500 });
  }
}
