import { emitLivMicroBetLaunch } from "@/lib/enterprise/liv-golf/emit-micro-bet-launch";
import { clearActiveStreamGraphics } from "@/lib/enterprise/liv-golf/clear-active-stream-graphics";
import {
  LiveMicroBetsSessionUnavailableError,
  loadLiveMicroBetsSession,
  upsertLiveMicroBetsSession,
} from "@/lib/enterprise/liv-golf/live-micro-bets-session";
import { emitStreamGraphicsSync } from "@/lib/owner/emit-stream-graphics-sync";
import { findLivMicroBet, type MicroBetSessionPhase } from "@/lib/liv-micro-bets";
import { LIV_GOLF_TOUR_MAIN_ROOM } from "@/lib/live/types";
import { requireOwnerUser } from "@/lib/owner/auth";
import { isOwnerAuthed, ownerAuthFailureResponse, ownerJsonResponse } from "@/lib/owner/api-response";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SessionBody = {
  activeBetId?: unknown;
  phase?: unknown;
  resolvedWinner?: unknown;
};

function parsePhase(value: unknown): MicroBetSessionPhase | null {
  if (value === "OPEN" || value === "CLOSING_SOON" || value === "LOCKED" || value === "RESOLVED") {
    return value;
  }
  return null;
}

function parseResolvedWinner(value: unknown): "Yes" | "No" | null {
  if (value === "Yes" || value === "No") return value;
  return null;
}

async function broadcastSession(session: Awaited<ReturnType<typeof upsertLiveMicroBetsSession>>) {
  try {
    await emitLivMicroBetLaunch({
      roomId: LIV_GOLF_TOUR_MAIN_ROOM,
      activeBetId: session.activeBetId,
      is_active: Boolean(session.activeBetId),
      clearOverlays: session.clearOverlays,
      launchedAt: session.launchedAt,
      at: session.updatedAt,
      phase: session.phase,
      ends_at: session.endsAt,
      resolved_winner: session.resolvedWinner ?? undefined,
    });
  } catch (broadcastError) {
    console.error(
      "[enterprise/liv-golf/micro-bets/session] realtime broadcast failed; session row was saved:",
      broadcastError,
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = (await request.json()) as SessionBody;
    const rawId = body.activeBetId;
    const requestedPhase = parsePhase(body.phase);
    const requestedWinner = parseResolvedWinner(body.resolvedWinner);

    const current = await loadLiveMicroBetsSession();

    let activeBetId: string | null | undefined = undefined;
    if (rawId === null) {
      activeBetId = null;
    } else if (typeof rawId === "string") {
      const trimmed = rawId.trim();
      activeBetId = trimmed.length > 0 ? trimmed : null;
    } else if (rawId !== undefined) {
      return ownerJsonResponse({ success: false, error: "Invalid active bet id." }, 400);
    }

    const nextActiveBetId = activeBetId !== undefined ? activeBetId : (current?.activeBetId ?? null);

    if (nextActiveBetId && !findLivMicroBet(nextActiveBetId)) {
      return ownerJsonResponse({ success: false, error: "Unknown micro-bet id." }, 400);
    }

    const isLaunch = activeBetId !== undefined && Boolean(activeBetId);
    const isTerminate = activeBetId === null;
    const isPhaseOnly =
      activeBetId === undefined && requestedPhase !== null && Boolean(current?.activeBetId);

    const admin = getSupabaseAdmin();

    if (isLaunch) {
      await clearActiveStreamGraphics(admin);
      await emitStreamGraphicsSync();
    }

    const session = await upsertLiveMicroBetsSession({
      activeBetId: isPhaseOnly ? current!.activeBetId : nextActiveBetId,
      clearOverlays: isLaunch ? true : isTerminate ? false : (current?.clearOverlays ?? false),
      updatedBy: auth.userId,
      phase:
        requestedPhase ??
        (isLaunch ? "OPEN" : isTerminate ? "OPEN" : current?.phase ?? "OPEN"),
      endsAt: isPhaseOnly ? current?.endsAt ?? null : isTerminate ? null : undefined,
      resolvedWinner: isTerminate || isLaunch ? null : requestedWinner ?? undefined,
      winningSelectionId: isTerminate || isLaunch ? null : undefined,
      preserveLaunchedAt: isPhaseOnly,
      launchedAt: isPhaseOnly ? current?.launchedAt ?? null : isTerminate ? null : undefined,
    });

    await broadcastSession(session);

    return ownerJsonResponse({
      success: true,
      roomId: LIV_GOLF_TOUR_MAIN_ROOM,
      activeBetId: session.activeBetId,
      activeBet: findLivMicroBet(session.activeBetId),
      isActive: Boolean(session.activeBetId),
      clearOverlays: session.clearOverlays,
      launchedAt: session.launchedAt,
      updatedAt: session.updatedAt,
      phase: session.phase,
      endsAt: session.endsAt,
      resolvedWinner: session.resolvedWinner,
      winningSelectionId: session.winningSelectionId,
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
