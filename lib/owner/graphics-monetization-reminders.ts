import type { SupabaseClient } from "@supabase/supabase-js";
import { loadOwnerStreamState, updateOwnerStreamState } from "@/lib/owner/load-owner-state";

export const GRAPHICS_MONETIZATION_REMINDERS_KEY = "graphics_monetization_reminders";
export const MAX_MONETIZATION_REMINDER_DISPLAY_SECONDS = 10;

export const MONETIZATION_REMINDER_CTA_KINDS = [
  "buy_seeds",
  "give",
  "sow_seeds",
  "support_ian",
] as const;

export type MonetizationReminderCtaKind = (typeof MONETIZATION_REMINDER_CTA_KINDS)[number];

export type GraphicsMonetizationReminderMessage = {
  id: string;
  headline: string;
  body: string;
  ctaKind: MonetizationReminderCtaKind;
  ctaLabel: string;
};

export type GraphicsMonetizationReminderSchedule = {
  enabled: boolean;
  intervalMinutes: number;
  displaySeconds: number;
  /** ISO timestamp — reminder slots count forward from this anchor (set on go-live or manual reset). */
  scheduleAnchorAt: string | null;
  messages: GraphicsMonetizationReminderMessage[];
  updatedAt: string | null;
  updatedBy: string | null;
};

export type ActiveMonetizationReminder = {
  slotIndex: number;
  message: GraphicsMonetizationReminderMessage;
  slotStartedAt: string;
  visibleUntil: string;
};

export const DEFAULT_GRAPHICS_MONETIZATION_REMINDER_MESSAGES: GraphicsMonetizationReminderMessage[] =
  [
    {
      id: "buy-seeds",
      headline: "Fuel the Stream",
      body: "Purchase Vital Seeds to sow into tonight's worship experience.",
      ctaKind: "buy_seeds",
      ctaLabel: "Buy Seeds",
    },
    {
      id: "give-app",
      headline: "Support Ian Craig",
      body: "Give through the Vital Seed Giving app and stand with this ministry.",
      ctaKind: "give",
      ctaLabel: "Open Giving",
    },
    {
      id: "sow-sanctuary",
      headline: "Sow Into the Sanctuary",
      body: "Send seeds into the live offering and energize the room.",
      ctaKind: "sow_seeds",
      ctaLabel: "Sow 100 Seeds",
    },
    {
      id: "support-awakening",
      headline: "Stand With The Awakening",
      body: "Your generosity keeps Ian Craig & 300 reaching more families online.",
      ctaKind: "support_ian",
      ctaLabel: "Support Now",
    },
  ];

export const DEFAULT_GRAPHICS_MONETIZATION_REMINDER_SCHEDULE: GraphicsMonetizationReminderSchedule =
  {
    enabled: true,
    intervalMinutes: 25,
    displaySeconds: MAX_MONETIZATION_REMINDER_DISPLAY_SECONDS,
    scheduleAnchorAt: null,
    messages: DEFAULT_GRAPHICS_MONETIZATION_REMINDER_MESSAGES,
    updatedAt: null,
    updatedBy: null,
  };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function cleanText(value: unknown, fallback: string, max = 180): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, max);
}

function normalizeCtaKind(value: unknown): MonetizationReminderCtaKind {
  if (
    typeof value === "string" &&
    MONETIZATION_REMINDER_CTA_KINDS.includes(value as MonetizationReminderCtaKind)
  ) {
    return value as MonetizationReminderCtaKind;
  }
  return "buy_seeds";
}

function normalizeMessage(
  raw: unknown,
  fallback: GraphicsMonetizationReminderMessage,
): GraphicsMonetizationReminderMessage {
  const record = asRecord(raw);
  return {
    id: cleanText(record.id, fallback.id, 64),
    headline: cleanText(record.headline, fallback.headline, 80),
    body: cleanText(record.body, fallback.body, 220),
    ctaKind: normalizeCtaKind(record.ctaKind),
    ctaLabel: cleanText(record.ctaLabel, fallback.ctaLabel, 40),
  };
}

function normalizeMessages(raw: unknown): GraphicsMonetizationReminderMessage[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_GRAPHICS_MONETIZATION_REMINDER_MESSAGES;
  }

  const defaults = DEFAULT_GRAPHICS_MONETIZATION_REMINDER_MESSAGES;
  return raw.slice(0, 12).map((entry, index) => {
    const fallback = defaults[index % defaults.length]!;
    return normalizeMessage(entry, fallback);
  });
}

export function normalizeGraphicsMonetizationReminderSchedule(
  raw: unknown,
): GraphicsMonetizationReminderSchedule {
  const record = asRecord(raw);
  const intervalMinutes = Number(record.intervalMinutes);
  const displaySeconds = Number(record.displaySeconds);

  return {
    enabled: record.enabled !== false,
    intervalMinutes: Number.isFinite(intervalMinutes)
      ? Math.min(120, Math.max(10, Math.round(intervalMinutes)))
      : DEFAULT_GRAPHICS_MONETIZATION_REMINDER_SCHEDULE.intervalMinutes,
    displaySeconds: Number.isFinite(displaySeconds)
      ? Math.min(MAX_MONETIZATION_REMINDER_DISPLAY_SECONDS, Math.max(1, Math.round(displaySeconds)))
      : DEFAULT_GRAPHICS_MONETIZATION_REMINDER_SCHEDULE.displaySeconds,
    scheduleAnchorAt:
      typeof record.scheduleAnchorAt === "string" && record.scheduleAnchorAt.trim()
        ? record.scheduleAnchorAt.trim()
        : null,
    messages: normalizeMessages(record.messages),
    updatedAt:
      typeof record.updatedAt === "string" && record.updatedAt.trim() ? record.updatedAt : null,
    updatedBy:
      typeof record.updatedBy === "string" && record.updatedBy.trim() ? record.updatedBy : null,
  };
}

export function resolveActiveMonetizationReminder(
  schedule: GraphicsMonetizationReminderSchedule,
  options: { isLive: boolean; nowMs?: number },
): ActiveMonetizationReminder | null {
  if (!schedule.enabled || !options.isLive) return null;
  if (!schedule.scheduleAnchorAt || schedule.messages.length === 0) return null;

  const now = options.nowMs ?? Date.now();
  const anchor = Date.parse(schedule.scheduleAnchorAt);
  if (Number.isNaN(anchor) || now < anchor) return null;

  const intervalMs = schedule.intervalMinutes * 60 * 1000;
  const displayMs = schedule.displaySeconds * 1000;
  const elapsed = now - anchor;
  const slotIndex = Math.floor(elapsed / intervalMs);
  const slotStart = anchor + slotIndex * intervalMs;
  const msIntoSlot = now - slotStart;

  if (msIntoSlot >= displayMs) return null;

  const message = schedule.messages[slotIndex % schedule.messages.length]!;
  return {
    slotIndex,
    message,
    slotStartedAt: new Date(slotStart).toISOString(),
    visibleUntil: new Date(slotStart + displayMs).toISOString(),
  };
}

export function computeNextMonetizationReminderAt(
  schedule: GraphicsMonetizationReminderSchedule,
  options: { isLive: boolean; nowMs?: number },
): string | null {
  if (!schedule.enabled || !options.isLive || !schedule.scheduleAnchorAt) return null;

  const now = options.nowMs ?? Date.now();
  const anchor = Date.parse(schedule.scheduleAnchorAt);
  if (Number.isNaN(anchor) || now < anchor) return schedule.scheduleAnchorAt;

  const intervalMs = schedule.intervalMinutes * 60 * 1000;
  const elapsed = now - anchor;
  const slotIndex = Math.floor(elapsed / intervalMs);
  const slotStart = anchor + slotIndex * intervalMs;
  const msIntoSlot = now - slotStart;
  const displayMs = schedule.displaySeconds * 1000;

  if (msIntoSlot < displayMs) {
    return new Date(slotStart).toISOString();
  }

  return new Date(slotStart + intervalMs).toISOString();
}

async function readScheduleFromRow(
  row: Awaited<ReturnType<typeof loadOwnerStreamState>>["row"],
): Promise<GraphicsMonetizationReminderSchedule> {
  const presets = asRecord(row?.audio_master_presets);
  return normalizeGraphicsMonetizationReminderSchedule(presets[GRAPHICS_MONETIZATION_REMINDERS_KEY]);
}

export async function loadGraphicsMonetizationReminders(
  admin?: SupabaseClient,
): Promise<GraphicsMonetizationReminderSchedule> {
  const client = admin ?? (await import("@/lib/supabase/server")).getSupabaseAdmin();
  const { row } = await loadOwnerStreamState(client);
  return readScheduleFromRow(row);
}

export async function saveGraphicsMonetizationReminders(
  input: Record<string, unknown>,
  updatedBy: string,
  admin?: SupabaseClient,
): Promise<GraphicsMonetizationReminderSchedule> {
  const client = admin ?? (await import("@/lib/supabase/server")).getSupabaseAdmin();
  const { row } = await loadOwnerStreamState(client);
  const current = await readScheduleFromRow(row);

  const next = normalizeGraphicsMonetizationReminderSchedule({
    ...current,
    ...input,
    messages: input.messages ?? current.messages,
    updatedAt: new Date().toISOString(),
    updatedBy,
  });

  const existingPresets = asRecord(row?.audio_master_presets);
  const { error } = await updateOwnerStreamState(client, {
    audio_master_presets: {
      ...existingPresets,
      [GRAPHICS_MONETIZATION_REMINDERS_KEY]: next,
    },
    updated_by: updatedBy,
  });

  if (error) throw new Error(error);
  return next;
}

/** Start or restart the reminder clock — called on go-live and from Graphics page. */
export async function armMonetizationReminderSchedule(
  updatedBy: string,
  admin?: SupabaseClient,
): Promise<GraphicsMonetizationReminderSchedule> {
  const client = admin ?? (await import("@/lib/supabase/server")).getSupabaseAdmin();
  const current = await loadGraphicsMonetizationReminders(client);
  if (!current.enabled) return current;

  return saveGraphicsMonetizationReminders(
    {
      ...current,
      scheduleAnchorAt: new Date().toISOString(),
    },
    updatedBy,
    client,
  );
}

export async function armMonetizationReminderScheduleOnGoLive(
  admin: SupabaseClient,
  updatedBy: string,
): Promise<void> {
  try {
    await armMonetizationReminderSchedule(updatedBy, admin);
  } catch (error) {
    console.warn("[graphics-monetization-reminders] go-live arm failed:", error);
  }
}
