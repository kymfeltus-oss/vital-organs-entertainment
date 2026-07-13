import { findLegendaryShowcaseScenario } from "@/lib/enterprise/liv-golf/legendary-showcase-scenarios";

/** Map a resolved Yes/No outcome to the wager selection id stored on the session row. */
export function resolveWinningSelectionId(
  betId: string,
  winningOption: "Yes" | "No",
): string {
  const showcase = findLegendaryShowcaseScenario(betId);
  if (showcase) {
    const match = showcase.selections.find((selection) => selection.mapsTo === winningOption);
    if (match) return match.id;
  }

  return winningOption === "Yes" ? "yes" : "no";
}
