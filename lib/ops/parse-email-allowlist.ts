export function parseEmailAllowlist(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];

  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}
