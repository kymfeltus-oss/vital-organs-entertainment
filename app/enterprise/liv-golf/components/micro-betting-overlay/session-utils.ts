import type { LiveMicroBetsSession } from "@/lib/liv-micro-bets";
import type { LiveMicroBetPayload } from "@/lib/live/types";
import type { LiveMicroBetSession, MicroBetSessionPhase, OverlayServerSession } from "./types";

/** Default in-stream wagering window from studio launch to lock. */
export const LIV_MICRO_BET_WINDOW_SECONDS = 30;

export function toOverlaySessionRow(session: LiveMicroBetsSession): LiveMicroBetSession {
  return {
    id: session.id,
    active_bet_id: session.activeBetId,
    clear_overlays: session.clearOverlays,
    launched_at: session.launchedAt,
    updated_at: session.updatedAt,
    updated_by: session.updatedBy,
    phase: session.phase,
    ends_at: session.endsAt,
    resolved_winner: session.resolvedWinner,
  };
}

export function deriveEndsAt(
  launchedAt: string | null,
  windowSeconds = LIV_MICRO_BET_WINDOW_SECONDS,
): string | null {
  if (!launchedAt) return null;
  const end = new Date(launchedAt);
  if (Number.isNaN(end.getTime())) return null;
  end.setSeconds(end.getSeconds() + windowSeconds);
  return end.toISOString();
}

export function computeSecondsRemaining(endsAt: string | null, nowMs = Date.now()): number {
  if (!endsAt) return 0;
  const endMs = new Date(endsAt).getTime();
  if (Number.isNaN(endMs)) return 0;
  return Math.max(0, Math.ceil((endMs - nowMs) / 1000));
}

export function computeSessionPhase(input: {
  isActive: boolean;
  clearOverlays: boolean;
  resolvedWinner: "Yes" | "No" | null;
  secondsRemaining: number;
  launchedAt: string | null;
  serverPhase?: MicroBetSessionPhase | null;
}): MicroBetSessionPhase {
  if (input.serverPhase === "RESOLVED" || input.resolvedWinner) {
    return "RESOLVED";
  }

  if (input.clearOverlays) {
    return "RESOLVED";
  }

  if (!input.isActive) {
    return input.launchedAt ? "RESOLVED" : "OPEN";
  }

  if (input.secondsRemaining <= 0) {
    return "LOCKED";
  }

  if (input.secondsRemaining <= 5) {
    return "CLOSING_SOON";
  }

  return "OPEN";
}

export function buildOverlayServerSession(input: {
  session: LiveMicroBetSession | null;
  activeBet: LiveMicroBetPayload | null;
  isActive: boolean;
  clearOverlays: boolean;
  resolvedWinner?: "Yes" | "No" | null;
  windowSeconds?: number;
}): OverlayServerSession | null {
  if (!input.session) return null;

  const ends_at =
    input.session.ends_at ?? deriveEndsAt(input.session.launched_at, input.windowSeconds);
  const secondsRemaining = computeSecondsRemaining(ends_at);
  const resolved_winner = input.resolvedWinner ?? input.session.resolved_winner ?? null;

  const phase =
    input.session.phase === "LOCKED" || input.session.phase === "RESOLVED"
      ? input.session.phase
      : computeSessionPhase({
          isActive: input.isActive,
          clearOverlays: input.clearOverlays,
          resolvedWinner: resolved_winner,
          secondsRemaining,
          launchedAt: input.session.launched_at,
          serverPhase: input.session.phase,
        });

  return {
    ...input.session,
    phase,
    ends_at,
    activeBet: input.activeBet,
    is_active: input.isActive,
    resolved_winner,
  };
}
