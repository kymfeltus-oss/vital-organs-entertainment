"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Clock3, Loader2, RefreshCw, Save, Sparkles } from "lucide-react";
import type {
  GraphicsMonetizationReminderMessage,
  GraphicsMonetizationReminderSchedule,
} from "@/lib/owner/graphics-monetization-reminders";
import {
  DEFAULT_GRAPHICS_MONETIZATION_REMINDER_MESSAGES,
  MONETIZATION_REMINDER_CTA_KINDS,
} from "@/lib/owner/graphics-monetization-reminders";

type ApiResponse = {
  success: boolean;
  schedule?: GraphicsMonetizationReminderSchedule;
  isLive?: boolean;
  active?: { slotIndex: number; message: GraphicsMonetizationReminderMessage } | null;
  nextAt?: string | null;
  message?: string;
  error?: string;
};

const CTA_LABELS: Record<(typeof MONETIZATION_REMINDER_CTA_KINDS)[number], string> = {
  buy_seeds: "Buy Seeds",
  give: "Open Giving App",
  sow_seeds: "Sow 100 Seeds (in live)",
  support_ian: "Support Ian Craig (Giving)",
};

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function GraphicsMonetizationRemindersPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [nextAt, setNextAt] = useState<string | null>(null);
  const [draft, setDraft] = useState<GraphicsMonetizationReminderSchedule | null>(null);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/owner/graphics/monetization-reminders", {
        cache: "no-store",
      });
      const json = (await response.json()) as ApiResponse;
      if (!response.ok || !json.success || !json.schedule) {
        throw new Error(json.error ?? "Unable to load monetization reminders.");
      }
      setDraft(json.schedule);
      setIsLive(json.isLive === true);
      setNextAt(json.nextAt ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load schedule.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  const messageCount = draft?.messages.length ?? 0;

  const previewSummary = useMemo(() => {
    if (!draft) return "";
    return `${draft.intervalMinutes}-minute rotation · ${draft.displaySeconds}s on screen · ${messageCount} messages`;
  }, [draft, messageCount]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/owner/graphics/monetization-reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const json = (await response.json()) as ApiResponse;
      if (!response.ok || !json.success || !json.schedule) {
        throw new Error(json.error ?? "Unable to save schedule.");
      }
      setDraft(json.schedule);
      setIsLive(json.isLive === true);
      setNextAt(json.nextAt ?? null);
      setSuccess(json.message ?? "Monetization reminders saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save schedule.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetClock() {
    setResetting(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/owner/graphics/monetization-reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_clock" }),
      });
      const json = (await response.json()) as ApiResponse;
      if (!response.ok || !json.success || !json.schedule) {
        throw new Error(json.error ?? "Unable to reset reminder clock.");
      }
      setDraft(json.schedule);
      setIsLive(json.isLive === true);
      setNextAt(json.nextAt ?? null);
      setSuccess(json.message ?? "Reminder clock reset.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to reset clock.");
    } finally {
      setResetting(false);
    }
  }

  function updateMessage(index: number, patch: Partial<GraphicsMonetizationReminderMessage>) {
    if (!draft) return;
    setDraft({
      ...draft,
      messages: draft.messages.map((message, messageIndex) =>
        messageIndex === index ? { ...message, ...patch } : message,
      ),
    });
  }

  function restoreDefaultMessages() {
    if (!draft) return;
    setDraft({
      ...draft,
      messages: DEFAULT_GRAPHICS_MONETIZATION_REMINDER_MESSAGES,
    });
  }

  if (loading || !draft) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-[6px] border border-white/10 bg-[#050814]/94 p-6 text-white/70">
        <Loader2 className="mr-3 h-5 w-5 animate-spin text-[#00DDEB]" />
        Loading monetization reminder schedule...
      </div>
    );
  }

  return (
    <section className="rounded-[6px] border border-[#ff4fd8]/25 bg-[#050814]/94 p-4 shadow-[0_0_28px_rgba(255,79,216,0.08)] sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-ui text-[0.65rem] uppercase tracking-[0.24em] text-[#ff8de0]">
            Live Monetization Reminders
          </p>
          <h3 className="mt-1 font-headline text-xl uppercase tracking-[0.06em] text-white">
            Scheduled Seed & Giving Prompts
          </h3>
          <p className="mt-2 max-w-2xl font-body text-sm text-white/55">
            Attendees on <span className="text-white/80">/live</span> see these reminders on a
            repeating schedule while the broadcast is live. Configure the rotation here; the clock
            starts automatically at go-live or when you reset it below.
          </p>
        </div>
        <div className="rounded-[6px] border border-white/10 bg-white/[0.03] px-3 py-2 text-right">
          <p className="font-ui text-[0.58rem] uppercase tracking-[0.14em] text-white/45">Stream</p>
          <p className={`font-ui text-xs font-bold uppercase ${isLive ? "text-emerald-300" : "text-white/60"}`}>
            {isLive ? "Live now" : "Offline"}
          </p>
          <p className="mt-1 font-body text-xs text-white/45">Next slot: {formatTimestamp(nextAt)}</p>
        </div>
      </div>

      <form onSubmit={(event) => void handleSave(event)} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[auto_1fr_1fr]">
          <label className="flex items-center gap-3 rounded-[6px] border border-white/10 bg-black/30 px-4 py-3">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })}
              className="h-4 w-4 accent-[#00DDEB]"
            />
            <span className="font-ui text-xs uppercase tracking-[0.12em] text-white">Enabled</span>
          </label>

          <label className="block rounded-[6px] border border-white/10 bg-black/30 px-4 py-3">
            <span className="font-ui text-[0.62rem] uppercase tracking-[0.12em] text-white/55">
              Interval (minutes)
            </span>
            <input
              type="number"
              min={10}
              max={120}
              value={draft.intervalMinutes}
              onChange={(event) =>
                setDraft({ ...draft, intervalMinutes: Number(event.target.value) || 25 })
              }
              className="mt-2 w-full rounded-[4px] border border-white/10 bg-[#08111f] px-3 py-2 font-body text-sm text-white"
            />
          </label>

          <label className="block rounded-[6px] border border-white/10 bg-black/30 px-4 py-3">
            <span className="font-ui text-[0.62rem] uppercase tracking-[0.12em] text-white/55">
              On-screen duration (seconds)
            </span>
            <input
              type="number"
              min={20}
              max={180}
              value={draft.displaySeconds}
              onChange={(event) =>
                setDraft({ ...draft, displaySeconds: Number(event.target.value) || 50 })
              }
              className="mt-2 w-full rounded-[4px] border border-white/10 bg-[#08111f] px-3 py-2 font-body text-sm text-white"
            />
          </label>
        </div>

        <div className="rounded-[6px] border border-white/10 bg-black/20 p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="font-ui text-xs uppercase tracking-[0.14em] text-white/75">
              Reminder rotation ({messageCount})
            </p>
            <button
              type="button"
              onClick={restoreDefaultMessages}
              className="font-ui text-[0.58rem] uppercase tracking-[0.12em] text-[#00DDEB]"
            >
              Restore defaults
            </button>
          </div>

          <div className="space-y-3">
            {draft.messages.map((message, index) => (
              <article
                key={message.id}
                className="grid gap-3 rounded-[6px] border border-white/10 bg-[#06101f] p-3 lg:grid-cols-[1fr_1.2fr_auto]"
              >
                <label className="block">
                  <span className="font-ui text-[0.58rem] uppercase text-white/45">Headline</span>
                  <input
                    value={message.headline}
                    onChange={(event) => updateMessage(index, { headline: event.target.value })}
                    className="mt-1 w-full rounded-[4px] border border-white/10 bg-[#08111f] px-3 py-2 font-body text-sm text-white"
                  />
                </label>
                <label className="block">
                  <span className="font-ui text-[0.58rem] uppercase text-white/45">Message</span>
                  <input
                    value={message.body}
                    onChange={(event) => updateMessage(index, { body: event.target.value })}
                    className="mt-1 w-full rounded-[4px] border border-white/10 bg-[#08111f] px-3 py-2 font-body text-sm text-white"
                  />
                </label>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <label className="block">
                    <span className="font-ui text-[0.58rem] uppercase text-white/45">Action</span>
                    <select
                      value={message.ctaKind}
                      onChange={(event) =>
                        updateMessage(index, {
                          ctaKind: event.target.value as GraphicsMonetizationReminderMessage["ctaKind"],
                        })
                      }
                      className="mt-1 w-full rounded-[4px] border border-white/10 bg-[#08111f] px-3 py-2 font-body text-sm text-white"
                    >
                      {MONETIZATION_REMINDER_CTA_KINDS.map((kind) => (
                        <option key={kind} value={kind}>
                          {CTA_LABELS[kind]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="font-ui text-[0.58rem] uppercase text-white/45">Button label</span>
                    <input
                      value={message.ctaLabel}
                      onChange={(event) => updateMessage(index, { ctaLabel: event.target.value })}
                      className="mt-1 w-full rounded-[4px] border border-white/10 bg-[#08111f] px-3 py-2 font-body text-sm text-white"
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center gap-2 rounded-[6px] border border-[#00DDEB]/40 bg-[#00DDEB]/10 px-4 font-ui text-xs uppercase tracking-[0.12em] text-[#9df8ff] disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save schedule
          </button>
          <button
            type="button"
            disabled={resetting}
            onClick={() => void handleResetClock()}
            className="inline-flex min-h-11 items-center gap-2 rounded-[6px] border border-white/15 bg-white/5 px-4 font-ui text-xs uppercase tracking-[0.12em] text-white disabled:opacity-50"
          >
            {resetting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Reset reminder clock
          </button>
          <p className="inline-flex items-center gap-2 font-body text-xs text-white/45">
            <Clock3 className="h-4 w-4" />
            {previewSummary}
          </p>
        </div>
      </form>

      {error ? (
        <p className="mt-4 rounded-[6px] border border-red-500/40 bg-red-500/10 p-3 font-body text-sm text-red-100">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-4 rounded-[6px] border border-emerald-400/40 bg-emerald-400/10 p-3 font-body text-sm text-emerald-100">
          {success}
        </p>
      ) : null}

      <p className="mt-4 inline-flex items-center gap-2 font-body text-xs text-white/40">
        <Sparkles className="h-3.5 w-3.5 text-brand-pink" />
        Reminders appear on attendee live video only while the stream is live and this schedule is enabled.
      </p>
    </section>
  );
}
