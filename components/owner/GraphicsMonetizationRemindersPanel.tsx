"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, GripVertical, Loader2, RotateCcw, Save } from "lucide-react";
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
  nextAt?: string | null;
  message?: string;
  error?: string;
};

const CTA_LABELS: Record<(typeof MONETIZATION_REMINDER_CTA_KINDS)[number], string> = {
  buy_seeds: "Buy Seeds",
  give: "Give Online",
  sow_seeds: "Text to Give",
  support_ian: "Support Ian",
};

export default function GraphicsMonetizationRemindersPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [draft, setDraft] = useState<GraphicsMonetizationReminderSchedule | null>(null);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/owner/graphics/monetization-reminders", { cache: "no-store" });
      const json = (await response.json()) as ApiResponse;
      if (!response.ok || !json.success || !json.schedule) {
        throw new Error(json.error ?? "Unable to load the scheduled prompts.");
      }
      setDraft(json.schedule);
      setIsLive(json.isLive === true);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load the scheduled prompts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSchedule(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSchedule]);

  function updateMessage(index: number, patch: Partial<GraphicsMonetizationReminderMessage>) {
    if (!draft) return;
    setDraft({
      ...draft,
      messages: draft.messages.map((message, messageIndex) =>
        messageIndex === index ? { ...message, ...patch } : message,
      ),
    });
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || saving) return;
    if (draft.messages.some((message) => !message.headline.trim() || !message.body.trim() || !message.ctaLabel.trim())) {
      setError("Every scheduled prompt needs a headline, message, and button label.");
      return;
    }

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
        throw new Error(json.error ?? "Unable to save the scheduled prompts.");
      }
      setDraft(json.schedule);
      setIsLive(json.isLive === true);
      setSuccess(json.message ?? "Schedule saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the scheduled prompts.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetClock() {
    if (resetting) return;
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
        throw new Error(json.error ?? "Unable to reset the prompt rotation.");
      }
      setDraft(json.schedule);
      setIsLive(json.isLive === true);
      setSuccess(json.message ?? "Rotation reset.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to reset the prompt rotation.");
    } finally {
      setResetting(false);
    }
  }

  if (loading || !draft) {
    return (
      <section className="flex min-h-40 items-center justify-center rounded-[3px] border border-white/10 bg-[#090d0f] font-ui text-xs uppercase tracking-wider text-white/55">
        <Loader2 className="mr-3 h-4 w-4 animate-spin text-[#00bff8]" /> Loading scheduled prompts
      </section>
    );
  }

  const fieldClass = "h-8 w-full rounded-[2px] border border-white/10 bg-[#090d0f] px-2 font-body text-[0.72rem] text-white outline-none transition focus:border-[#00bff8]/65 disabled:opacity-50";

  return (
    <section className="overflow-hidden rounded-[3px] border border-white/10 bg-[linear-gradient(110deg,#0b1012,#070a0c)] shadow-[0_10px_32px_rgba(0,0,0,0.32)]">
      <form onSubmit={(event) => void handleSave(event)}>
        <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <h2 className="font-headline text-lg uppercase tracking-[0.05em] text-white/85 sm:text-xl">Scheduled Seed &amp; Giving Prompts</h2>
            <label className="inline-flex cursor-pointer items-center gap-2 font-ui text-[0.62rem] font-bold uppercase tracking-[0.09em] text-[#7ee92d]">
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })}
                className="sr-only"
              />
              <span className={`grid h-4 w-4 place-items-center rounded-full border ${draft.enabled ? "border-[#7ee92d]" : "border-white/30"}`}>
                {draft.enabled ? <CheckCircle2 className="h-3 w-3" /> : null}
              </span>
              {draft.enabled ? "Enabled" : "Disabled"}
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4 font-ui text-[0.6rem] uppercase tracking-[0.08em] text-white/55">
            <span className="flex items-center gap-2 border-r border-white/10 pr-4">
              Stream status:
              <strong className={isLive ? "text-[#7ee92d]" : "text-white/55"}>
                <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${isLive ? "bg-[#7ee92d] shadow-[0_0_8px_#7ee92d]" : "bg-white/25"}`} />
                {isLive ? "Live" : "Offline"}
              </strong>
            </span>
            <label className="flex items-center gap-2">
              Interval (min):
              <input
                type="number"
                min={10}
                max={120}
                value={draft.intervalMinutes}
                onChange={(event) => setDraft({ ...draft, intervalMinutes: Number(event.target.value) })}
                className="h-8 w-16 rounded-[2px] border border-white/15 bg-[#0b1012] px-2 text-white outline-none focus:border-[#00bff8]/65"
              />
            </label>
            <label className="flex items-center gap-2">
              On-screen duration (sec):
              <input
                type="number"
                min={20}
                max={180}
                value={draft.displaySeconds}
                onChange={(event) => setDraft({ ...draft, displaySeconds: Number(event.target.value) })}
                className="h-8 w-16 rounded-[2px] border border-white/15 bg-[#0b1012] px-2 text-white outline-none focus:border-[#00bff8]/65"
              />
            </label>
          </div>
        </div>

        <div className="grid xl:grid-cols-[minmax(0,1fr)_11.25rem]">
          <div className="overflow-x-auto p-2">
            <table className="w-full min-w-[800px] border-collapse text-left">
              <thead className="bg-white/[0.025] font-ui text-[0.57rem] uppercase tracking-[0.08em] text-white/55">
                <tr>
                  <th className="w-12 px-3 py-2">#</th>
                  <th className="px-2 py-2">Headline</th>
                  <th className="px-2 py-2">Message</th>
                  <th className="w-44 px-2 py-2">Action</th>
                  <th className="w-40 px-2 py-2">Button Label</th>
                  <th className="w-10 px-2 py-2"><span className="sr-only">Reorder</span></th>
                </tr>
              </thead>
              <tbody>
                {draft.messages.map((message, index) => (
                  <tr key={message.id} className="border-t border-white/[0.07]">
                    <td className="px-3 py-1 font-ui text-[0.65rem] text-white/65">{index + 1}</td>
                    <td className="px-2 py-1">
                      <input aria-label={`Prompt ${index + 1} headline`} maxLength={80} value={message.headline} onChange={(event) => updateMessage(index, { headline: event.target.value })} className={fieldClass} />
                    </td>
                    <td className="px-2 py-1">
                      <input aria-label={`Prompt ${index + 1} message`} maxLength={220} value={message.body} onChange={(event) => updateMessage(index, { body: event.target.value })} className={fieldClass} />
                    </td>
                    <td className="px-2 py-1">
                      <select aria-label={`Prompt ${index + 1} action`} value={message.ctaKind} onChange={(event) => updateMessage(index, { ctaKind: event.target.value as GraphicsMonetizationReminderMessage["ctaKind"] })} className={fieldClass}>
                        {MONETIZATION_REMINDER_CTA_KINDS.map((kind) => <option key={kind} value={kind}>{CTA_LABELS[kind]}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input aria-label={`Prompt ${index + 1} button label`} maxLength={40} value={message.ctaLabel} onChange={(event) => updateMessage(index, { ctaLabel: event.target.value })} className={`${fieldClass} border-[#ff2c9f]/45 font-ui text-[0.62rem] font-bold uppercase text-[#ff4db2]`} />
                    </td>
                    <td className="px-2 py-1 text-white/35"><GripVertical className="h-4 w-4" aria-hidden="true" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid content-center gap-3 border-t border-white/10 p-3 xl:border-l xl:border-t-0">
            <button type="button" onClick={() => setDraft({ ...draft, messages: DEFAULT_GRAPHICS_MONETIZATION_REMINDER_MESSAGES.map((message) => ({ ...message })) })} className="min-h-9 rounded-[2px] border border-white/20 bg-white/[0.02] px-3 font-ui text-[0.62rem] font-bold uppercase tracking-[0.06em] text-white/70 transition hover:border-white/40 hover:text-white active:translate-y-px">
              Restore Defaults
            </button>
            <button type="submit" disabled={saving || resetting} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-[2px] bg-[#00afe9] px-3 font-ui text-[0.62rem] font-black uppercase tracking-[0.06em] text-[#001018] transition hover:bg-[#35caff] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save Schedule
            </button>
            <button type="button" disabled={saving || resetting} onClick={() => void handleResetClock()} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-[2px] border border-red-500/70 bg-red-500/[0.03] px-3 font-ui text-[0.62rem] font-bold uppercase tracking-[0.06em] text-red-400 transition hover:bg-red-500/10 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45">
              {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />} Reset Rotation
            </button>
          </div>
        </div>
      </form>

      {error || success ? (
        <div role="status" className={`border-t px-4 py-2 font-body text-xs ${error ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"}`}>
          {error ?? success}
        </div>
      ) : null}
    </section>
  );
}
