import type { AccessTier } from "@/lib/owner/show-setup-state";

export type LowerThirdTheme = "NEON_PURPLE_SLIDE" | "MINIMAL_GLASS_FADE" | "CYAN_GLOW";

export type LowerThirdAsset = {
  id: string;
  primaryText: string;
  secondaryText: string;
  theme: LowerThirdTheme;
};

export type ProgramSegment = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
};

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function sanitizeUiText(value: string, limit: number): string {
  return value.replace(/<[^>]*>/g, "").replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, limit);
}

export function minutesToClock(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function parseClockMinutes(value: string): number | null {
  const [minsRaw] = value.split(":");
  const minutes = Number.parseInt(minsRaw ?? "", 10);
  return Number.isFinite(minutes) ? minutes : null;
}

export function toDateTimeLocal(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function fromDateTimeLocal(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export function getCountdownParts(targetDateTime: string, nowMs = Date.now()): CountdownParts {
  const target = new Date(targetDateTime).getTime();
  const diff = Number.isFinite(target) ? Math.max(0, target - nowMs) : 0;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function getProjectedConclusion(targetDateTime: string, totalRuntime: number): string {
  const target = new Date(targetDateTime);
  if (Number.isNaN(target.getTime())) return "Set date";
  target.setMinutes(target.getMinutes() + totalRuntime);
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(target);
}

export function parseTicketPricing(value: string): { ga?: number; vip?: number } {
  const matches = value.match(/\d+(?:\.\d+)?/g);
  return {
    ga: matches?.[0] ? Number(matches[0]) : undefined,
    vip: matches?.[1] ? Number(matches[1]) : undefined,
  };
}

export function validateShowSetupInput(input: {
  showTitle: string;
  presenterName: string;
  targetDateTime: string;
  lowerThirds: LowerThirdAsset[];
  programFlow: ProgramSegment[];
  ticketPricingGA: number;
  ticketPricingVIP: number;
  accessTiers: AccessTier[];
}): string | null {
  if (!sanitizeUiText(input.showTitle, 120)) return "Show title is required.";
  if (!sanitizeUiText(input.presenterName, 120)) return "Presenter / lead name is required.";
  if (Number.isNaN(new Date(input.targetDateTime).getTime())) return "Event start time is invalid.";
  if (!input.accessTiers.length) return "Select at least one access tier.";
  if (!Number.isFinite(input.ticketPricingGA) || input.ticketPricingGA < 0) return "GA ticket price must be 0 or higher.";
  if (!Number.isFinite(input.ticketPricingVIP) || input.ticketPricingVIP < 0) return "VIP ticket price must be 0 or higher.";
  if (!input.lowerThirds.length) return "At least one lower-third graphic is required.";
  if (input.lowerThirds.some((asset) => !sanitizeUiText(asset.primaryText, 80))) {
    return "Every lower-third needs primary text.";
  }
  if (!input.programFlow.length) return "Program flow needs at least one segment.";
  if (input.programFlow.some((segment) => !sanitizeUiText(segment.title, 80))) {
    return "Every program segment needs a title.";
  }
  if (input.programFlow.some((segment) => !Number.isFinite(segment.durationMinutes) || segment.durationMinutes < 1)) {
    return "Every program segment needs a duration of at least 1 minute.";
  }
  return null;
}
