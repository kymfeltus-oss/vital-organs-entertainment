import type { LiveMicroBetPayload } from "@/lib/live/types";

export type LivMicroBetOption = "Yes" | "No";
export type LivMicroBet = {
  id: string;
  question: string;
  stake: number;
  payout: number;
  options: readonly [LivMicroBetOption, LivMicroBetOption];
};

export type LiveMicroBetsSession = {
  id: string;
  activeBetId: string | null;
  clearOverlays: boolean;
  launchedAt: string | null;
  updatedAt: string;
  updatedBy: string | null;
};

export type LivMicroBetLaunchPayload = {
  roomId: string;
  activeBetId: string | null;
  is_active: boolean;
  clearOverlays: boolean;
  launchedAt: string | null;
  at: string;
};

/** Production prop catalog — configured situational bets for LIV Golf live sessions. */
export const LIV_MICRO_BETS: readonly LivMicroBet[] = [
  {
    id: "bryson-drive",
    question: "Will Bryson DeChambeau clear 350 yards on this drive?",
    stake: 10,
    payout: 50,
    options: ["Yes", "No"] as const,
  },
  {
    id: "brooks-putt",
    question: "Will Brooks Koepka sink this 12-foot birdie putt?",
    stake: 20,
    payout: 60,
    options: ["Yes", "No"] as const,
  },
  {
    id: "cam-eagle",
    question: "Will Cameron Smith eagle Hole 14?",
    stake: 15,
    payout: 75,
    options: ["Yes", "No"] as const,
  },
  {
    id: "team-aces",
    question: "Will Aces GC lead after Round 1?",
    stake: 25,
    payout: 100,
    options: ["Yes", "No"] as const,
  },
] as const;

export const LIV_MICRO_BET_TRANSACTION_TYPE = "liv_micro_bet";

export function findLivMicroBet(betId: string | null | undefined): LivMicroBet | null {
  if (!betId) return null;
  return LIV_MICRO_BETS.find((bet) => bet.id === betId) ?? null;
}

export function toLiveMicroBetPayload(bet: LivMicroBet, isActive: boolean): LiveMicroBetPayload {
  return {
    bet_id: bet.id,
    question: bet.question,
    stake_amount: bet.stake,
    payout_amount: bet.payout,
    is_active: isActive,
    options: bet.options as LiveMicroBetPayload["options"],
  };
}

export function mapLiveMicroBetsSessionRow(row: {
  id: string;
  active_bet_id: string | null;
  clear_overlays: boolean;
  launched_at: string | null;
  updated_at: string;
  updated_by: string | null;
}): LiveMicroBetsSession {
  return {
    id: row.id,
    activeBetId: row.active_bet_id,
    clearOverlays: row.clear_overlays,
    launchedAt: row.launched_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}
