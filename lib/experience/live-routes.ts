/** Canonical attendee live experience — Viewer POV Go Live layouts. */
export const EXPERIENCE_LIVE_PATH = "/experience/live/ig";

/** Legacy `/experience/live` and aliases forward here. */
export function experienceLivePathWithQuery(searchParams: URLSearchParams): string {
  const query = searchParams.toString();
  return query ? `${EXPERIENCE_LIVE_PATH}?${query}` : EXPERIENCE_LIVE_PATH;
}

export function experienceLivePathFromRecord(
  params: Record<string, string | string[] | undefined>,
): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const entry of value) {
        query.append(key, entry);
      }
      continue;
    }
    query.set(key, value);
  }

  return experienceLivePathWithQuery(query);
}
