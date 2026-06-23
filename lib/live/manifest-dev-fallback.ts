/** Public Mux test HLS (Big Buck Bunny) — safe dev fallback for manifest proxy. */
export const DEV_MANIFEST_FALLBACK_HLS =
  "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

export type ManifestExperienceKey =
  | "main_stage"
  | "crowd_xp"
  | "musician_xp"
  | "prayer_layer";

export type ManifestSuccessPayload = {
  success: true;
  playbackUrl: string;
  activeExperience: ManifestExperienceKey;
  activeSource: "primary" | "backup";
  fallback?: true;
  fallbackReason?: string;
};

export function isDevManifestFallbackEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

export function buildDevManifestFallbackPayload(
  experience: ManifestExperienceKey,
  reason: string,
): ManifestSuccessPayload {
  console.warn(`[stream/manifest] Dev fallback manifest (${reason}) → ${DEV_MANIFEST_FALLBACK_HLS}`);

  return {
    success: true,
    playbackUrl: DEV_MANIFEST_FALLBACK_HLS,
    activeExperience: experience,
    activeSource: "primary",
    fallback: true,
    fallbackReason: reason,
  };
}
