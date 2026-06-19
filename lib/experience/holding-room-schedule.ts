const US_TIMEZONE_BY_OFFSET: Record<string, string> = {
  "-05:00": "America/Chicago",
  "-06:00": "America/Chicago",
  "-07:00": "America/Denver",
  "-08:00": "America/Los_Angeles",
  "-04:00": "America/New_York",
};

const DEFAULT_EVENT_TIMEZONE = "America/Chicago";

function resolveTimeZoneFromIso(startIso: string): string {
  const offsetMatch = startIso.match(/([+-]\d{2}:\d{2})$/);
  if (!offsetMatch) return DEFAULT_EVENT_TIMEZONE;
  return US_TIMEZONE_BY_OFFSET[offsetMatch[1]] ?? DEFAULT_EVENT_TIMEZONE;
}

export function formatHoldingRoomEventDate(startIso: string): string {
  const timeZone = resolveTimeZoneFromIso(startIso);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone,
  }).format(new Date(startIso));
}

export function formatHoldingRoomEventTime(startIso: string): string {
  const timeZone = resolveTimeZoneFromIso(startIso);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone,
  }).format(new Date(startIso));
}
