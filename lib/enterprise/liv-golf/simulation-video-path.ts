/** Normalize client/webhook video paths to safe public/videos/*.mp4 URLs. */
export function normalizeVideoAssetPath(path: unknown): string | null {
  if (typeof path !== "string") return null;

  const trimmed = path.trim();
  if (!trimmed.startsWith("/videos/") || trimmed.includes("..")) {
    return null;
  }

  if (!/\.mp4$/i.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/** Build a public video path from a filename key (no extension). */
export function buildSimulationVideoPath(playerKey: string): string {
  const safe = playerKey.trim().replace(/[^a-zA-Z0-9_-]/g, "");
  return `/videos/${safe}.mp4`;
}

export function playerKeyFromVideoUrl(videoUrl: string): string {
  const match = videoUrl.match(/\/videos\/([^/]+)\.mp4$/i);
  return match?.[1] ?? "";
}
