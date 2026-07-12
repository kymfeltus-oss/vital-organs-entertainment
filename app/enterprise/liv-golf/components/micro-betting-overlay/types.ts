import type { LiveMicroBetPayload } from "@/lib/live/types";

/** Mirrors Postgres `live_micro_bets_session` row exactly (snake_case). */
export type LiveMicroBetSession = {
  id: string;
  active_bet_id: string | null;
  clear_overlays: boolean;
  launched_at: string | null;
  updated_at: string;
  updated_by: string | null;
  phase: MicroBetSessionPhase;
  ends_at: string | null;
  resolved_winner: "Yes" | "No" | null;
};

/** Re-exported production bet envelope from the realtime subscriber / GET API. */
export type { LiveMicroBetPayload };

export type MicroBetSessionPhase = "OPEN" | "CLOSING_SOON" | "LOCKED" | "RESOLVED";

/** Authoritative session envelope passed into the overlay hook. */
export type OverlayServerSession = LiveMicroBetSession & {
  phase: MicroBetSessionPhase;
  ends_at: string | null;
  activeBet: LiveMicroBetPayload | null;
  is_active: boolean;
  resolved_winner: "Yes" | "No" | null;
};

export type OverlayPhase = "OPEN" | "CLOSING_SOON" | "LOCKED" | "RESOLVED" | "CONFIRMED";

export type WagerStatus = "idle" | "submitting" | "confirmed" | "error";

export interface Selection {
  id: string;
  name: string;
  multiplier: number;
}

export interface LiveMarket {
  id: string;
  player: {
    name: string;
    team: string;
    teamColor: string;
    image: string;
  };
  question: string;
  selections: Selection[];
  stakeAmount: number;
  payoutAmount: number;
  windowSeconds: number;
}

/** POST body for `/api/enterprise/liv-golf/micro-bets/place`. */
export type PlaceWagerPayload = {
  betId: string;
  selection: "Yes" | "No";
  lat?: number;
  lng?: number;
  capturedAt?: string;
  geoAttestationToken?: string | null;
};

export type PlaceWagerResponse = {
  success: boolean;
  balance?: number | null;
  payout?: number;
  selection?: "Yes" | "No";
  region_verified?: string;
  message?: string;
  code?: string;
};
