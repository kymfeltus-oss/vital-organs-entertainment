/** Stream sources for historic showcase simulation — local MP4 preferred, CDN fallback for dev. */
export type ScenarioVideoSource = {
  id: string;
  label: string;
  /** Drop file at this public path for production clips. */
  localMp4: string;
  /** Embeddable MP4 used when local asset is missing (no manual hosting required). */
  fallbackMp4: string;
};

export const SCENARIO_VIDEO_SOURCES: Record<string, ScenarioVideoSource> = {
  "tiger-masters-chip": {
    id: "tiger-masters-chip",
    label: "Tiger Masters Chip-In (2005)",
    localMp4: "/videos/tiger_masters_2005.mp4",
    fallbackMp4:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  },
  "bryson-lake-drive": {
    id: "bryson-lake-drive",
    label: "Bryson Lake Carry (2021)",
    localMp4: "/videos/bryson_lake_2021.mp4",
    fallbackMp4:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  },
  "spieth-bunker-playoff": {
    id: "spieth-bunker-playoff",
    label: "Spieth Bunker Hole-Out (2017)",
    localMp4: "/videos/spieth_bunker_2017.mp4",
    fallbackMp4:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  },
};

export function resolveScenarioVideoSource(
  marketId: string | null | undefined,
): ScenarioVideoSource | null {
  if (!marketId) return null;
  return SCENARIO_VIDEO_SOURCES[marketId] ?? null;
}

export function getScenarioPlaybackUrl(
  source: ScenarioVideoSource,
  useFallback: boolean,
): string {
  return useFallback ? source.fallbackMp4 : source.localMp4;
}
