/** Derive attendee-facing profile labels from verified Supabase identity. */

export function firstNameFromEmail(email: string | null | undefined): string {
  if (!email?.trim()) return "Guest";

  const local = email.trim().toLowerCase().split("@")[0] ?? "";
  const parts = local.replace(/[._+-]/g, " ").split(/\s+/).filter(Boolean);
  const first = parts[0] ?? "guest";

  return first.charAt(0).toUpperCase() + first.slice(1);
}

export function initialsFromIdentity(
  email: string | null | undefined,
  displayName?: string | null,
): string {
  const trimmedDisplay = displayName?.trim();
  if (trimmedDisplay) {
    const parts = trimmedDisplay.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return trimmedDisplay.slice(0, 2).toUpperCase();
  }

  if (!email?.trim()) return "G";

  const local = email.trim().toLowerCase().split("@")[0] ?? "";
  const parts = local.replace(/[._+-]/g, " ").split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }

  const single = parts[0] ?? local;
  if (single.length >= 2) return single.slice(0, 2).toUpperCase();
  return single.charAt(0).toUpperCase();
}
