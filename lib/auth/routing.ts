export const PERSONA_HUB_PATH = "/email-gate";
export const ATTENDEE_GATE_PATH = "/email-gate/attendee";
export const TEAM_GATE_PATH = "/email-gate/team";

export const DEFAULT_ATTENDEE_NEXT = "/experience";
export const DEFAULT_TEAM_NEXT = "/dashboard/broadcast";
export const DEFAULT_OPS_NEXT = "/ops/live-hub";

const ATTENDEE_PROTECTED_EXACT = new Set(["/dashboard"]);
const ATTENDEE_PROTECTED_PREFIXES = ["/experience"];

const TEAM_PROTECTED_PREFIXES = ["/ops", "/dashboard/broadcast"];

export function sanitizeNextPath(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;

  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  return trimmed;
}

export function buildGateUrl(
  gatePath: string,
  nextPath: string,
  extraParams?: Record<string, string>,
): string {
  const params = new URLSearchParams();
  params.set("next", nextPath);

  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      params.set(key, value);
    }
  }

  return `${gatePath}?${params.toString()}`;
}

export function buildPersonaHubUrl(nextPath?: string | null): string {
  return buildGateUrl(
    PERSONA_HUB_PATH,
    sanitizeNextPath(nextPath, DEFAULT_ATTENDEE_NEXT),
  );
}

export function buildAttendeeGateUrl(nextPath?: string | null): string {
  return buildGateUrl(
    ATTENDEE_GATE_PATH,
    sanitizeNextPath(nextPath, DEFAULT_ATTENDEE_NEXT),
    { persona: "attendee" },
  );
}

export function buildTeamGateUrl(nextPath?: string | null): string {
  return buildGateUrl(
    TEAM_GATE_PATH,
    sanitizeNextPath(nextPath, DEFAULT_TEAM_NEXT),
    { persona: "team" },
  );
}

export function isAttendeeProtectedPath(pathname: string): boolean {
  if (ATTENDEE_PROTECTED_EXACT.has(pathname)) return true;
  return ATTENDEE_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isTeamProtectedPath(pathname: string): boolean {
  return TEAM_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function resolveAttendeeDestination(nextPath: string): string {
  return sanitizeNextPath(nextPath, DEFAULT_ATTENDEE_NEXT);
}

/** Resolve the team destination after gate auth (no redundant query params). */
export function buildTeamPostAuthUrl(nextPath?: string | null): string {
  return sanitizeNextPath(nextPath, DEFAULT_TEAM_NEXT);
}
