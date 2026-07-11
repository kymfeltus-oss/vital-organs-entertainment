import type { LiveMicroBetPayload } from "@/lib/live/types";

export type LivOverlayState = "none" | "sponsor" | "commercial";

export type LivMicroBetOption = "Yes" | "No";

export type LivMicroBetCategory = "driving" | "putting" | "scrambling" | "team-prop";

export type LivMicroBet = {
  readonly id: string;
  readonly question: string;
  readonly stake: number;
  readonly payout: number;
  readonly options: readonly [LivMicroBetOption, LivMicroBetOption];
  readonly category: LivMicroBetCategory;
};

/** Producer + API catalog view with explicit amount field names. */
export type ActiveBet = {
  readonly id: string;
  readonly question: string;
  readonly stake_amount: number;
  readonly payout_amount: number;
  readonly options: readonly [LivMicroBetOption, LivMicroBetOption];
  readonly category: LivMicroBetCategory;
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

/** Production prop catalog — single source of truth for studio switcher + consumer APIs. */
export const LIV_MICRO_BETS: readonly LivMicroBet[] = [
  {
    id: "bryson-drive",
    question: "Will Bryson DeChambeau clear 350 yards on this fairway drive?",
    stake: 10,
    payout: 50,
    options: ["Yes", "No"] as const,
    category: "driving",
  },
  {
    id: "brooks-putt",
    question: "Will Brooks Koepka sink this 12-foot birdie putt?",
    stake: 20,
    payout: 60,
    options: ["Yes", "No"] as const,
    category: "putting",
  },
  {
    id: "cam-eagle",
    question: "Will Cameron Smith eagle Hole 14?",
    stake: 15,
    payout: 75,
    options: ["Yes", "No"] as const,
    category: "putting",
  },
  {
    id: "team-aces",
    question: "Will Aces GC lead after Round 1?",
    stake: 25,
    payout: 100,
    options: ["Yes", "No"] as const,
    category: "team-prop",
  },
  {
    id: "crushers-hole-16",
    question: "Will Crushers GC record a combined under-par score on Hole 16?",
    stake: 25,
    payout: 75,
    options: ["Yes", "No"] as const,
    category: "team-prop",
  },
  {
    id: "tyrell-sand-save",
    question: "Will Tyrrell Hatton get up-and-down for par from the greenside bunker?",
    stake: 15,
    payout: 45,
    options: ["Yes", "No"] as const,
    category: "scrambling",
  },
] as const;

/** @deprecated Alias — prefer `LIV_MICRO_BETS` in production code. */
export const DEMO_BETS: readonly ActiveBet[] = LIV_MICRO_BETS.map(toActiveBet);

export const LIV_MICRO_BET_TRANSACTION_TYPE = "liv_micro_bet";

export function toActiveBet(bet: LivMicroBet): ActiveBet {
  return {
    id: bet.id,
    question: bet.question,
    stake_amount: bet.stake,
    payout_amount: bet.payout,
    options: bet.options,
    category: bet.category,
  };
}

export function findLivMicroBet(betId: string | null | undefined): LivMicroBet | null {
  if (!betId) return null;
  return LIV_MICRO_BETS.find((bet) => bet.id === betId) ?? null;
}

export function findLivMicroBetsByCategory(category: LivMicroBetCategory): readonly LivMicroBet[] {
  return LIV_MICRO_BETS.filter((bet) => bet.category === category);
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
