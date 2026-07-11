import { emitLivMicroBetLaunch } from "@/lib/enterprise/liv-golf/emit-micro-bet-launch";
import {
  LiveMicroBetsSessionUnavailableError,
  upsertLiveMicroBetsSession,
} from "@/lib/enterprise/liv-golf/live-micro-bets-session";
import { findLivMicroBet } from "@/lib/liv-micro-bets";
import { LIV_GOLF_TOUR_MAIN_ROOM } from "@/lib/live/types";

export type OddsFeedHoleContext = {
  hole_number?: number;
  associated_room_id?: string;
};

export type OddsFeedEventDetails = {
  lie_type?: string;
  player_name?: string;
  live_scramble_odds_multiplier?: number;
};

export type OddsFeedPayload = {
  event_type?: string;
  player_id?: string;
  hole_context?: OddsFeedHoleContext;
  event_details?: OddsFeedEventDetails;
};

export type OddsFeedProcessResult =
  | {
      status: "processed";
      auto_launched_bet: string;
      room_id: string;
      suggested_payout?: number;
    }
  | {
      status: "ignored";
      message: string;
    };

function resolveRoomId(payload: OddsFeedPayload): string {
  const roomId = payload.hole_context?.associated_room_id?.trim();
  return roomId && roomId.length > 0 ? roomId : LIV_GOLF_TOUR_MAIN_ROOM;
}

/** Map live data feed situations to catalog bet template IDs. */
export function resolveCatalogBetForOddsEvent(payload: OddsFeedPayload): string | null {
  const eventType = payload.event_type?.trim();
  const lieType = payload.event_details?.lie_type?.trim().toLowerCase();

  if (eventType === "PLAYER_SHOT_SITUATION" && lieType === "bunker") {
    return "tyrell-sand-save";
  }

  if (eventType === "TEAM_HOLE_SCORING" && payload.hole_context?.hole_number === 16) {
    return "crushers-hole-16";
  }

  if (eventType === "PLAYER_DRIVE_DISTANCE" && payload.event_details?.player_name) {
    return "bryson-drive";
  }

  if (eventType === "PLAYER_PUTT_ATTEMPT") {
    return "brooks-putt";
  }

  return null;
}

export function computeSuggestedPayout(
  baseStake: number,
  multiplier: number | undefined,
  catalogPayout: number,
): number {
  if (!multiplier || !Number.isFinite(multiplier) || multiplier <= 1) {
    return catalogPayout;
  }
  return Math.max(catalogPayout, Math.floor(baseStake * multiplier));
}

/** Launch the closest catalog prop bet for an automated sportsbook feed event. */
export async function processOddsFeedPayload(
  payload: OddsFeedPayload,
  updatedBy = "",
): Promise<OddsFeedProcessResult> {
  const catalogBetId = resolveCatalogBetForOddsEvent(payload);

  if (!catalogBetId) {
    return {
      status: "ignored",
      message: "Event type context not applicable for prop generation.",
    };
  }

  const bet = findLivMicroBet(catalogBetId);
  if (!bet) {
    return {
      status: "ignored",
      message: `Matched catalog id "${catalogBetId}" is not registered.`,
    };
  }

  const roomId = resolveRoomId(payload);
  const suggestedPayout = computeSuggestedPayout(
    bet.stake,
    payload.event_details?.live_scramble_odds_multiplier,
    bet.payout,
  );

  const session = await upsertLiveMicroBetsSession({
    activeBetId: bet.id,
    clearOverlays: true,
    updatedBy,
  });

  await emitLivMicroBetLaunch({
    roomId,
    activeBetId: session.activeBetId,
    is_active: Boolean(session.activeBetId),
    clearOverlays: session.clearOverlays,
    launchedAt: session.launchedAt,
    at: session.updatedAt,
  });

  return {
    status: "processed",
    auto_launched_bet: bet.id,
    room_id: roomId,
    suggested_payout: suggestedPayout,
  };
}
