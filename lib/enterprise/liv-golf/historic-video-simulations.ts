import {
  LEGENDARY_SHOWCASE_SCENARIOS,
  toShowcaseSessionJson,
  type LegendaryShowcaseScenario,
} from "@/lib/enterprise/liv-golf/legendary-showcase-scenarios";

export type HistoricVideoSimulation = {
  id: string;
  title: string;
  player: string;
  videoUrl: string;
  lockAtSecond: number;
  resolveAtSecond: number;
  wageringWindowSeconds: number;
  scenario: LegendaryShowcaseScenario;
};

const SIMULATION_META: Record<
  string,
  Pick<HistoricVideoSimulation, "title" | "videoUrl" | "lockAtSecond" | "resolveAtSecond">
> = {
  "tiger-masters-chip": {
    title: "Tiger's Iconic Masters Chip-In (2005)",
    videoUrl: "/videos/tiger_masters_2005.mp4",
    lockAtSecond: 12,
    resolveAtSecond: 24,
  },
  "bryson-lake-drive": {
    title: "Bryson's 370Y Lake Monster Drive (2021)",
    videoUrl: "/videos/bryson_lake_2021.mp4",
    lockAtSecond: 8,
    resolveAtSecond: 16,
  },
  "spieth-bunker-playoff": {
    title: "Spieth's Playoff Bunker Hole-Out (2017)",
    videoUrl: "/videos/spieth_bunker_2017.mp4",
    lockAtSecond: 6,
    resolveAtSecond: 13,
  },
};

/** Pre-configured historic video run-list aligned to legendary showcase catalog IDs. */
export const HISTORIC_VIDEO_SIMULATIONS: readonly HistoricVideoSimulation[] =
  LEGENDARY_SHOWCASE_SCENARIOS.map((scenario) => {
    const meta = SIMULATION_META[scenario.id];
    return {
      id: scenario.id,
      title: meta?.title ?? scenario.question,
      player: scenario.playerName,
      videoUrl: meta?.videoUrl ?? "",
      lockAtSecond: meta?.lockAtSecond ?? 10,
      resolveAtSecond: meta?.resolveAtSecond ?? 20,
      wageringWindowSeconds: scenario.wageringWindowSeconds,
      scenario,
    };
  });

export function findHistoricVideoSimulation(
  id: string | null | undefined,
): HistoricVideoSimulation | null {
  if (!id) return null;
  return HISTORIC_VIDEO_SIMULATIONS.find((entry) => entry.id === id) ?? null;
}

export function buildSimulationSessionPreview(
  simulation: HistoricVideoSimulation,
  phase: "OPEN" | "LOCKED" | "RESOLVED" = "OPEN",
  endsAt: string | null = null,
) {
  return toShowcaseSessionJson(simulation.scenario, phase, endsAt);
}
