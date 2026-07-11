import { emitLivMicroBetLaunch } from "@/lib/enterprise/liv-golf/emit-micro-bet-launch";
import { clearActiveStreamGraphics } from "@/lib/enterprise/liv-golf/clear-active-stream-graphics";
import {
  LiveMicroBetsSessionUnavailableError,
  upsertLiveMicroBetsSession,
} from "@/lib/enterprise/liv-golf/live-micro-bets-session";
import { emitStreamGraphicsSync } from "@/lib/owner/emit-stream-graphics-sync";
import { findLivMicroBet } from "@/lib/liv-micro-bets";
import { LIV_GOLF_TOUR_MAIN_ROOM } from "@/lib/live/types";
import { requireOwnerUser } from "@/lib/owner/auth";
import { isOwnerAuthed, ownerAuthFailureResponse, ownerJsonResponse } from "@/lib/owner/api-response";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SessionBody = {
  activeBetId?: unknown;
};

export async function PATCH(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = (await request.json()) as SessionBody;
    const rawId = body.activeBetId;

    let activeBetId: string | null = null;
    if (rawId === null) {
      activeBetId = null;
    } else if (typeof rawId === "string") {
      const trimmed = rawId.trim();
      activeBetId = trimmed.length > 0 ? trimmed : null;
    } else if (rawId !== undefined) {
      return ownerJsonResponse({ success: false, error: "Invalid active bet id." }, 400);
    }

    if (activeBetId && !findLivMicroBet(activeBetId)) {
      return ownerJsonResponse({ success: false, error: "Unknown micro-bet id." }, 400);
    }

    const isLaunch = Boolean(activeBetId);
    const admin = getSupabaseAdmin();

    if (isLaunch) {
      await clearActiveStreamGraphics(admin);
      await emitStreamGraphicsSync();
    }

    const session = await upsertLiveMicroBetsSession({
      activeBetId,
      clearOverlays: isLaunch,
      updatedBy: auth.userId,
    });

    await emitLivMicroBetLaunch({
      roomId: LIV_GOLF_TOUR_MAIN_ROOM,
      activeBetId: session.activeBetId,
      is_active: Boolean(session.activeBetId),
      clearOverlays: session.clearOverlays,
      launchedAt: session.launchedAt,
      at: session.updatedAt,
    });

    return ownerJsonResponse({
      success: true,
      roomId: LIV_GOLF_TOUR_MAIN_ROOM,
      activeBetId: session.activeBetId,
      activeBet: findLivMicroBet(session.activeBetId),
      isActive: Boolean(session.activeBetId),
      clearOverlays: session.clearOverlays,
      launchedAt: session.launchedAt,
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    if (error instanceof LiveMicroBetsSessionUnavailableError) {
      return ownerJsonResponse(
        {
          success: false,
          error:
            "Production micro-bet session table is unavailable. Apply migration 20260711161000_live_micro_bets_session.sql.",
        },
        503,
      );
    }

    console.error("[enterprise/liv-golf/micro-bets/session] PATCH failed:", error);
    return ownerJsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to update micro-bet session.",
      },
      500,
    );
  }
}
