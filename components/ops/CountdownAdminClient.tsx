"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";
import DashboardHeroSection from "@/components/dashboard/DashboardHeroSection";
import {
  computeEventCountdownPhase,
  DEFAULT_COUNTDOWN_CONFIG,
  type EventCountdownConfig,
} from "@/lib/live/countdown-config";
import { computeCountdown } from "@/lib/live/event-lobby";

type CountdownAdminClientProps = {
  adminEmail: string;
  initialConfig: EventCountdownConfig;
};

function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fieldLabel(text: string) {
  return (
    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.22em] text-[#A1A1AA]">
      {text}
    </label>
  );
}

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-[#111111] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#1E40AF]/70 focus:ring-1 focus:ring-[#1E40AF]/40";

export default function CountdownAdminClient({
  adminEmail,
  initialConfig,
}: CountdownAdminClientProps) {
  const [form, setForm] = useState<EventCountdownConfig>(initialConfig);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewNow, setPreviewNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setPreviewNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const previewPhase = useMemo(
    () => computeEventCountdownPhase(form.start_time, form.end_time, previewNow),
    [form.end_time, form.start_time, previewNow],
  );

  const previewCountdown =
    previewPhase !== "waiting"
      ? { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true }
      : computeCountdown(form.start_time);

  const previewCta = useMemo(() => {
    if (previewPhase === "ended") {
      return { label: "EXPERIENCE ENDED", disabled: true, href: undefined };
    }
    if (previewPhase === "waiting") {
      return { label: form.cta_label_waiting, disabled: true, href: undefined };
    }
    return { label: form.cta_label_live, disabled: false, href: "/dashboard/live" };
  }, [form.cta_label_live, form.cta_label_waiting, previewPhase]);

  const updateField = useCallback(
    <K extends keyof EventCountdownConfig>(key: K, value: EventCountdownConfig[K]) => {
      setForm((current) => ({ ...current, [key]: value }));
      setStatus(null);
      setError(null);
    },
    [],
  );

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/countdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as EventCountdownConfig & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save configuration.");
      }

      setForm(payload);
      setStatus("Configuration saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setForm(DEFAULT_COUNTDOWN_CONFIG);
    setStatus("Reset to defaults. Save to publish.");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#050406] text-white">
      <header className="border-b border-white/10 bg-[#0B090A]/90 px-6 py-4">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#93C5FD]">
              Ops Console
            </p>
            <h1 className="text-xl font-black uppercase tracking-[0.14em]">
              Countdown Hero Editor
            </h1>
            <p className="mt-1 text-xs text-[#A1A1AA]">Signed in as {adminEmail}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/ops"
              className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#D4D4D8] hover:bg-white/[0.04]"
            >
              Back to Ops
            </Link>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#D4D4D8] hover:bg-white/[0.04]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl border border-[#B0267A]/70 bg-[#B0267A]/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-[#B0267A]/25 disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Save
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-6 py-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section className="rounded-[20px] border border-white/10 bg-[#111111] p-5">
          <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.24em] text-[#93C5FD]">
            Hero Copy & Timing
          </h2>

          <div className="space-y-4">
            <div>
              {fieldLabel("Eyebrow")}
              <input
                className={inputClassName}
                value={form.eyebrow}
                onChange={(e) => updateField("eyebrow", e.target.value)}
              />
            </div>
            <div>
              {fieldLabel("Headline")}
              <input
                className={inputClassName}
                value={form.headline}
                onChange={(e) => updateField("headline", e.target.value)}
              />
            </div>
            <div>
              {fieldLabel("Subtitle")}
              <input
                className={inputClassName}
                value={form.subtitle}
                onChange={(e) => updateField("subtitle", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                {fieldLabel("Countdown Start")}
                <input
                  type="datetime-local"
                  className={inputClassName}
                  value={toDatetimeLocalValue(form.start_time)}
                  onChange={(e) =>
                    updateField("start_time", new Date(e.target.value).toISOString())
                  }
                />
              </div>
              <div>
                {fieldLabel("Countdown End")}
                <input
                  type="datetime-local"
                  className={inputClassName}
                  value={toDatetimeLocalValue(form.end_time)}
                  onChange={(e) =>
                    updateField("end_time", new Date(e.target.value).toISOString())
                  }
                />
              </div>
            </div>
            <div>
              {fieldLabel("Status Label")}
              <input
                className={inputClassName}
                value={form.status_label}
                onChange={(e) => updateField("status_label", e.target.value)}
              />
            </div>
            <div>
              {fieldLabel("Waiting CTA Label")}
              <input
                className={inputClassName}
                value={form.cta_label_waiting}
                onChange={(e) => updateField("cta_label_waiting", e.target.value)}
              />
            </div>
            <div>
              {fieldLabel("Live CTA Label")}
              <input
                className={inputClassName}
                value={form.cta_label_live}
                onChange={(e) => updateField("cta_label_live", e.target.value)}
              />
            </div>
            <div>
              {fieldLabel("Helper Text")}
              <input
                className={inputClassName}
                value={form.helper_text}
                onChange={(e) => updateField("helper_text", e.target.value)}
              />
            </div>

            <h3 className="pt-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#E879B0]">
              Asset Paths
            </h3>

            <div>
              {fieldLabel("Hero Background")}
              <input
                className={inputClassName}
                value={form.hero_background_url}
                onChange={(e) => updateField("hero_background_url", e.target.value)}
              />
            </div>
            <div>
              {fieldLabel("Countdown Frame")}
              <input
                className={inputClassName}
                value={form.countdown_frame_url}
                onChange={(e) => updateField("countdown_frame_url", e.target.value)}
              />
            </div>
            <div>
              {fieldLabel("Waiting Signal Pill")}
              <input
                className={inputClassName}
                value={form.waiting_pill_url}
                onChange={(e) => updateField("waiting_pill_url", e.target.value)}
              />
            </div>
            <div>
              {fieldLabel("Button Frame")}
              <input
                className={inputClassName}
                value={form.button_frame_url}
                onChange={(e) => updateField("button_frame_url", e.target.value)}
              />
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0B090A] px-3 py-3">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => updateField("is_active", e.target.checked)}
                className="h-4 w-4 accent-[#B0267A]"
              />
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4D4D8]">
                Active on attendee dashboard
              </span>
            </label>
          </div>

          {status && <p className="mt-4 text-sm text-[#93C5FD]">{status}</p>}
          {error && <p className="mt-4 text-sm text-[#f87171]">{error}</p>}
        </section>

        <section className="rounded-[20px] border border-white/10 bg-[#0B090A] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#93C5FD]">
              Live Preview
            </h2>
            <span className="rounded-full border border-[#1E40AF]/50 bg-[#1E40AF]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#93C5FD]">
              Phase: {previewPhase}
            </span>
          </div>
          <DashboardHeroSection
            config={form}
            countdown={previewCountdown}
            eventPhase={previewPhase}
            showLiveSignal={previewPhase === "live"}
            ctaLabel={previewCta.label}
            ctaHref={previewCta.href}
            ctaDisabled={previewCta.disabled}
          />
        </section>
      </div>
    </div>
  );
}
