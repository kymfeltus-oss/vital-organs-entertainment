export type StudioEngineMode = "internal_studio" | "restream_api";

export const DEFAULT_STUDIO_ENGINE_MODE: StudioEngineMode = "restream_api";

export const STUDIO_ENGINE_MODES: readonly StudioEngineMode[] = [
  "internal_studio",
  "restream_api",
] as const;

export function normalizeStudioEngineMode(value: unknown): StudioEngineMode {
  if (value === "internal_studio" || value === "restream_api") {
    return value;
  }
  return DEFAULT_STUDIO_ENGINE_MODE;
}

export function isStudioEngineMode(value: unknown): value is StudioEngineMode {
  return value === "internal_studio" || value === "restream_api";
}
