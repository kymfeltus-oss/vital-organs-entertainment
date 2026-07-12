import type { LivMicroBet, LivMicroBetCategory } from "@/lib/liv-micro-bets";

export type ShowcaseSelection = {
  id: string;
  name: string;
  multiplier: number;
  mapsTo: "Yes" | "No";
};

export type LegendaryShowcaseScenario = LivMicroBet & {
  readonly showcase: true;
  readonly playerName: string;
  readonly teamName: string;
  readonly teamColor: string;
  readonly playerImage: string;
  readonly selections: readonly ShowcaseSelection[];
  readonly wageringWindowSeconds: number;
  readonly resolutionHint: string;
};

const BASE_STAKE = 10;

function payoutFromMultiplier(stake: number, multiplier: number): number {
  return Math.max(stake + 1, Math.round(stake * multiplier));
}

/** Iconic golf moments — scripted showcase props for studio presentations. */
export const LEGENDARY_SHOWCASE_SCENARIOS: readonly LegendaryShowcaseScenario[] = [
  {
    id: "tiger-masters-chip",
    showcase: true,
    question: "Will Tiger Woods chip in for birdie from off the green on Hole 16?",
    stake: BASE_STAKE,
    payout: payoutFromMultiplier(BASE_STAKE, 8.5),
    options: ["Yes", "No"] as const,
    category: "showcase" as LivMicroBetCategory,
    playerName: "Tiger Woods",
    teamName: "Legend Legend",
    teamColor: "#FF0000",
    playerImage: "https://api.dicebear.com/9.x/initials/svg?seed=Tiger%20Woods&backgroundColor=ff0000",
    selections: [
      { id: "yes", name: "Yes (Hole Out)", multiplier: 8.5, mapsTo: "Yes" },
      { id: "no", name: "No (Miss Green/Cup)", multiplier: 1.12, mapsTo: "No" },
    ],
    wageringWindowSeconds: 30,
    resolutionHint: "Lock when he strikes. Resolve YES after the ball drops.",
  },
  {
    id: "bryson-lake-drive",
    showcase: true,
    question: "Will Bryson DeChambeau's drive carry the water hazard and clear 350 yards?",
    stake: BASE_STAKE,
    payout: payoutFromMultiplier(BASE_STAKE, 2.1),
    options: ["Yes", "No"] as const,
    category: "showcase" as LivMicroBetCategory,
    playerName: "Bryson DeChambeau",
    teamName: "Crushers GC",
    teamColor: "#CCFF00",
    playerImage: "https://api.dicebear.com/9.x/initials/svg?seed=Bryson&backgroundColor=ccff00",
    selections: [
      { id: "yes", name: "Yes (Clears 350y)", multiplier: 2.1, mapsTo: "Yes" },
      { id: "no", name: "No (Water/Short)", multiplier: 1.75, mapsTo: "No" },
    ],
    wageringWindowSeconds: 45,
    resolutionHint: "Lock on backswing. Resolve YES when shot tracking confirms carry.",
  },
  {
    id: "spieth-bunker-playoff",
    showcase: true,
    question: "Will Jordan Spieth successfully save par or better from the green-side bunker?",
    stake: BASE_STAKE,
    payout: payoutFromMultiplier(BASE_STAKE, 1.45),
    options: ["Yes", "No"] as const,
    category: "showcase" as LivMicroBetCategory,
    playerName: "Jordan Spieth",
    teamName: "Texas Stars",
    teamColor: "#00E5FF",
    playerImage: "https://api.dicebear.com/9.x/initials/svg?seed=Jordan%20Spieth&backgroundColor=00e5ff",
    selections: [
      { id: "yes", name: "Yes (Birdie/Par Save)", multiplier: 1.45, mapsTo: "Yes" },
      { id: "no", name: "No (Bogey or Worse)", multiplier: 2.8, mapsTo: "No" },
    ],
    wageringWindowSeconds: 75,
    resolutionHint: "Lock while the ball is airborne. Resolve YES on hole-out.",
  },
] as const;

export function findLegendaryShowcaseScenario(
  betId: string | null | undefined,
): LegendaryShowcaseScenario | null {
  if (!betId) return null;
  return LEGENDARY_SHOWCASE_SCENARIOS.find((scenario) => scenario.id === betId) ?? null;
}

export function isShowcaseBetId(betId: string | null | undefined): boolean {
  return findLegendaryShowcaseScenario(betId) !== null;
}

/** Serialize a showcase scenario into the fan overlay session JSON shape. */
export function toShowcaseSessionJson(
  scenario: LegendaryShowcaseScenario,
  phase: "OPEN" | "LOCKED" | "RESOLVED" = "OPEN",
  endsAt: string | null = null,
) {
  return {
    id: "current",
    market_id: scenario.id,
    phase,
    player_name: scenario.playerName,
    team_name: scenario.teamName,
    team_color: scenario.teamColor,
    player_image: scenario.playerImage,
    question: scenario.question,
    selections: scenario.selections.map((selection) => ({
      id: selection.id,
      name: selection.name,
      multiplier: selection.multiplier,
    })),
    ends_at: endsAt,
  };
}

export function resolveShowcaseSelection(
  scenario: LegendaryShowcaseScenario,
  selectionId: string,
): "Yes" | "No" | null {
  const match = scenario.selections.find((entry) => entry.id === selectionId);
  return match?.mapsTo ?? null;
}

export function computeShowcaseEndsAt(
  scenario: LegendaryShowcaseScenario,
  launchedAt: string,
): string {
  const start = new Date(launchedAt);
  start.setSeconds(start.getSeconds() + scenario.wageringWindowSeconds);
  return start.toISOString();
}
