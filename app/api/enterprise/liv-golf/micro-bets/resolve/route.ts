import { NextResponse } from "next/server";
import { emitLivMicroBetResolve } from "@/lib/enterprise/liv-golf/emit-micro-bet-resolve";
import {
  LiveMicroBetsSessionUnavailableError,
  upsertLiveMicroBetsSession,
} from "@/lib/enterprise/liv-golf/live-micro-bets-session";
import { resolveWinningSelectionId } from "@/lib/enterprise/liv-golf/winning-selection";
import { findLivMicroBet } from "@/lib/liv-micro-bets";
import { LIV_GOLF_TOUR_MAIN_ROOM } from "@/lib/live/types";
import { requireOwnerUser } from "@/lib/owner/auth";
import { isOwnerAuthed, ownerAuthFailureResponse } from "@/lib/owner/api-response";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ResolveBetBody = {
  room_id?: unknown;
  bet_id?: unknown;
  action?: unknown;
  winning_option?: unknown;
};

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Unknown resolution error";
}

/** Production bet resolution — atomic payout, archive ledger, broadcast closure. */
export async function POST(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = (await request.json().catch(() => ({}))) as ResolveBetBody;
    const roomId =
      typeof body.room_id === "string" && body.room_id.trim()
        ? body.room_id.trim()
        : LIV_GOLF_TOUR_MAIN_ROOM;
    const betId = typeof body.bet_id === "string" ? body.bet_id.trim() : "";
    const action = body.action;
    const winningOption = body.winning_option;

    if (action !== "RESOLVE" || (winningOption !== "Yes" && winningOption !== "No") || !betId) {
      return NextResponse.json({ error: "Invalid operational parameters" }, { status: 400 });
    }

    if (!findLivMicroBet(betId)) {
      return NextResponse.json({ error: "Unknown micro-bet id." }, { status: 404 });
    }

    const admin = getSupabaseAdmin();
    const { data: totalPaid, error: rpcError } = await admin.rpc("resolve_and_payout_micro_bet", {
      p_room_id: roomId,
      p_bet_id: betId,
      p_winning_option: winningOption,
      p_resolved_by: auth.userId,
    });

    if (rpcError) throw rpcError;

    const winningSelectionId = resolveWinningSelectionId(betId, winningOption);

    const session = await upsertLiveMicroBetsSession({
      activeBetId: null,
      clearOverlays: false,
      phase: "RESOLVED",
      resolvedWinner: winningOption,
      winningSelectionId,
      updatedBy: auth.userId,
    });

    await emitLivMicroBetResolve({
      roomId,
      activeBetId: null,
      is_active: false,
      clearOverlays: session.clearOverlays,
      launchedAt: session.launchedAt,
      at: session.updatedAt,
      resolved_winner: winningOption,
    });

    return NextResponse.json({
      success: true,
      total_tokens_distributed: typeof totalPaid === "number" ? totalPaid : 0,
      winning_option: winningOption,
      bet_id: betId,
      room_id: roomId,
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

    console.error("[Resolution Ledger Exception Handled]:", errorMessage(error));
    return NextResponse.json(
      {
        error: "Internal transaction settlement fault.",
        details: errorMessage(error),
      },
      { status: 500 },
    );
  }
}
