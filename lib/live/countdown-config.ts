import { EVENT_LOBBY } from "@/lib/live/event-lobby";

export const DEFAULT_EVENT_ID = "300-awakening";

export type EventCountdownPhase = "waiting" | "live" | "ended";

export type EventCountdownConfig = {
  id?: string;
  event_id: string;
  headline: string;
  eyebrow: string;
  subtitle: string;
  start_time: string;
  end_time: string;
  status_label: string;
  cta_label_waiting: string;
  cta_label_live: string;
  helper_text: string;
  hero_background_url: string;
  countdown_frame_url: string;
  waiting_pill_url: string;
  button_frame_url: string;
  is_active: boolean;
};

const DEFAULT_END_ISO = "2026-06-07T23:30:00-05:00";

export const DEFAULT_COUNTDOWN_CONFIG: EventCountdownConfig = {
  event_id: DEFAULT_EVENT_ID,
  headline: "YOU'RE ALMOST LIVE",
  eyebrow: "LIVE RECORDING EXPERIENCE",
  subtitle: "THE AWAKENING BEGINS SOON",
  start_time: EVENT_LOBBY.targetIso,
  end_time: DEFAULT_END_ISO,
  status_label: "WAITING FOR LIVE SIGNAL",
  cta_label_waiting: "WAITING FOR LIVE",
  cta_label_live: "ENTER LIVE EXPERIENCE",
  helper_text: "STAY CLOSE. THE EXPERIENCE WILL OPEN AUTOMATICALLY.",
  hero_background_url: "/effects/hero-audience-banner.png",
  countdown_frame_url: "/ui/countdown-frame.png",
  waiting_pill_url: "/ui/waiting-live-signal-pill.png",
  button_frame_url: "/ui/enter-live-button-frame.png",
  is_active: true,
};

const TEXT_FIELD_LIMITS: Record<string, number> = {
  headline: 120,
  eyebrow: 80,
  subtitle: 120,
  status_label: 80,
  cta_label_waiting: 80,
  cta_label_live: 80,
  helper_text: 200,
};

const ASSET_FIELDS = [
  "hero_background_url",
  "countdown_frame_url",
  "waiting_pill_url",
  "button_frame_url",
] as const;

type AssetField = (typeof ASSET_FIELDS)[number];

const SAFE_ASSET_PATH = /^\/[a-zA-Z0-9/_.-]+$/;

function stripUnsafeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

function sanitizeTextField(key: keyof typeof TEXT_FIELD_LIMITS, value: unknown): string {
  const cleaned = stripUnsafeText(value).toUpperCase();
  const limit = TEXT_FIELD_LIMITS[key];
  return cleaned.slice(0, limit) || DEFAULT_COUNTDOWN_CONFIG[key];
}

function sanitizeAssetPath(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!SAFE_ASSET_PATH.test(trimmed) || trimmed.includes("..")) return fallback;
  return trimmed;
}

function parseIsoTime(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString();
}

export function computeEventCountdownPhase(
  startIso: string,
  endIso: string,
  nowMs = Date.now(),
): EventCountdownPhase {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return "waiting";
  if (nowMs < start) return "waiting";
  if (nowMs <= end) return "live";
  return "ended";
}

export type CountdownConfigValidationResult =
  | { ok: true; config: EventCountdownConfig }
  | { ok: false; error: string };

export function validateCountdownConfigInput(
  input: Record<string, unknown>,
): CountdownConfigValidationResult {
  const start_time = parseIsoTime(input.start_time, DEFAULT_COUNTDOWN_CONFIG.start_time);
  const end_time = parseIsoTime(input.end_time, DEFAULT_COUNTDOWN_CONFIG.end_time);

  if (new Date(end_time).getTime() <= new Date(start_time).getTime()) {
    return { ok: false, error: "End time must be after start time." };
  }

  const config: EventCountdownConfig = {
    event_id: DEFAULT_EVENT_ID,
    headline: sanitizeTextField("headline", input.headline),
    eyebrow: sanitizeTextField("eyebrow", input.eyebrow),
    subtitle: sanitizeTextField("subtitle", input.subtitle),
    start_time,
    end_time,
    status_label: sanitizeTextField("status_label", input.status_label),
    cta_label_waiting: sanitizeTextField("cta_label_waiting", input.cta_label_waiting),
    cta_label_live: sanitizeTextField("cta_label_live", input.cta_label_live),
    helper_text: sanitizeTextField("helper_text", input.helper_text),
    hero_background_url: sanitizeAssetPath(
      input.hero_background_url,
      DEFAULT_COUNTDOWN_CONFIG.hero_background_url,
    ),
    countdown_frame_url: sanitizeAssetPath(
      input.countdown_frame_url,
      DEFAULT_COUNTDOWN_CONFIG.countdown_frame_url,
    ),
    waiting_pill_url: sanitizeAssetPath(
      input.waiting_pill_url,
      DEFAULT_COUNTDOWN_CONFIG.waiting_pill_url,
    ),
    button_frame_url: sanitizeAssetPath(
      input.button_frame_url,
      DEFAULT_COUNTDOWN_CONFIG.button_frame_url,
    ),
    is_active: input.is_active !== false,
  };

  for (const field of ASSET_FIELDS) {
    if (!config[field as AssetField]) {
      return { ok: false, error: `Invalid asset path for ${field}.` };
    }
  }

  return { ok: true, config };
}

type CountdownConfigRow = {
  id: string;
  event_id: string;
  headline: string;
  eyebrow: string;
  subtitle: string;
  start_time: string;
  end_time: string;
  status_label: string;
  cta_label_waiting: string;
  cta_label_live: string;
  helper_text: string;
  hero_background_url: string;
  countdown_frame_url: string;
  waiting_pill_url: string;
  button_frame_url: string;
  is_active: boolean;
};

export function mapCountdownConfigRow(row: CountdownConfigRow): EventCountdownConfig {
  return {
    id: row.id,
    event_id: row.event_id,
    headline: row.headline,
    eyebrow: row.eyebrow,
    subtitle: row.subtitle,
    start_time: new Date(row.start_time).toISOString(),
    end_time: new Date(row.end_time).toISOString(),
    status_label: row.status_label,
    cta_label_waiting: row.cta_label_waiting,
    cta_label_live: row.cta_label_live,
    helper_text: row.helper_text,
    hero_background_url: row.hero_background_url,
    countdown_frame_url: row.countdown_frame_url,
    waiting_pill_url: row.waiting_pill_url,
    button_frame_url: row.button_frame_url,
    is_active: row.is_active,
  };
}

export function toPublicCountdownConfig(config: EventCountdownConfig): EventCountdownConfig {
  return {
    event_id: config.event_id,
    headline: config.headline,
    eyebrow: config.eyebrow,
    subtitle: config.subtitle,
    start_time: config.start_time,
    end_time: config.end_time,
    status_label: config.status_label,
    cta_label_waiting: config.cta_label_waiting,
    cta_label_live: config.cta_label_live,
    helper_text: config.helper_text,
    hero_background_url: config.hero_background_url,
    countdown_frame_url: config.countdown_frame_url,
    waiting_pill_url: config.waiting_pill_url,
    button_frame_url: config.button_frame_url,
    is_active: true,
  };
}
