"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  Clock,
  ImageIcon,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
  Type,
} from "lucide-react";
import LobbyCountdownTimer from "@/components/lobby/LobbyCountdownTimer";
import { EXPERIENCE_BRAND_ASSETS } from "@/lib/experience/brand-assets";
import { shouldShowCountdownTimer } from "@/lib/experience/countdown-display";
import { EXPERIENCE_LIVE_PATH } from "@/lib/experience/live-routes";
import {
  computeEventCountdownPhase,
  DEFAULT_COUNTDOWN_CONFIG,
  type EventCountdownConfig,
} from "@/lib/live/countdown-config";
import { COUNTDOWN_CONFIG_UPDATED_EVENT } from "@/lib/live/countdown-config-sync";
import {
  alignStartForHoldingRoom,
  buildFutureHoldingSchedule,
} from "@/lib/live/countdown-schedule-helpers";
import { saveLastKnownCountdown } from "@/lib/parable/last-known-good";
import { computeCountdown } from "@/lib/live/event-lobby";
import { PAGE_GRID } from "@/lib/responsive";

type CountdownAdminClientProps = {
  adminEmail: string;
  initialConfig: EventCountdownConfig;
};

function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDatetimeLocalInput(raw: string): string | null {
  const ms = new Date(raw).getTime();
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

function formatCurrentTimeDisplay(nowMs: number): string {
  return new Date(nowMs).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function isStartTimeNearNow(startIso: string, nowMs: number): boolean {
  const startMs = new Date(startIso).getTime();
  if (Number.isNaN(startMs)) return false;
  return Math.abs(startMs - nowMs) < 60_000;
}

function FieldLabel({ children }: { children: string }) {
  return (
    <span className="mb-1.5 block font-ui text-[0.62rem] font-bold uppercase tracking-[0.18em] text-brand-muted">
      {children}
    </span>
  );
}

function SectionHeader({
  icon,
  title,
  accent = "blue",
}: {
  icon: React.ReactNode;
  title: string;
  accent?: "blue" | "pink";
}) {
  const accentClass = accent === "pink" ? "text-brand-pink" : "text-brand-blue";
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-brand-border pb-4">
      <span className={accentClass}>{icon}</span>
      <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-white">
        {title}
      </h2>
    </div>
  );
}

const inputClassName =
  "w-full rounded-xl border border-brand-border bg-brand-panel/80 px-4 py-3 font-body text-sm text-white outline-none transition placeholder:text-brand-muted/45 focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/25";

const actionButtonClassName =
  "touch-target inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] transition disabled:opacity-60";

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

  const attendeeLiveSurface = useMemo(() => {
    if (previewPhase === "waiting") return "Holding room + countdown on /live";
    if (previewPhase === "live") return "Live stream POV on /live (holding hidden)";
    return "Holding room on /live (event ended)";
  }, [previewPhase]);

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
    return { label: form.cta_label_live, disabled: false, href: EXPERIENCE_LIVE_PATH };
  }, [form.cta_label_live, form.cta_label_waiting, previewPhase]);

  const currentTimeDisplay = formatCurrentTimeDisplay(previewNow);
  const startMatchesCurrentTime = isStartTimeNearNow(form.start_time, previewNow);

  const phaseBadgeClass =
    previewPhase === "live"
      ? "border-brand-pink/50 bg-brand-pink/10 text-brand-pink"
      : previewPhase === "waiting"
        ? "border-brand-blue/50 bg-brand-blue/10 text-brand-blue"
        : "border-brand-border bg-brand-panel text-brand-muted";

  const updateField = useCallback(
    <K extends keyof EventCountdownConfig>(key: K, value: EventCountdownConfig[K]) => {
      setForm((current) => ({ ...current, [key]: value }));
      setStatus(null);
      setError(null);
    },
    [],
  );

  const applyCurrentTimeAsStart = useCallback(() => {
    updateField("start_time", new Date(previewNow).toISOString());
  }, [previewNow, updateField]);

  const persistConfig = useCallback(async (configToSave: EventCountdownConfig) => {
    setIsSaving(true);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/countdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configToSave),
      });

      const payload = (await response.json()) as EventCountdownConfig & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save configuration.");
      }

      setForm(payload);
      saveLastKnownCountdown(payload);
      window.dispatchEvent(new Event(COUNTDOWN_CONFIG_UPDATED_EVENT));
      return payload;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save configuration.");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleSave = async () => {
    const saved = await persistConfig(form);
    if (saved) setStatus("Configuration saved.");
  };

  const handleRestoreHoldingRoom = async () => {
    const alignedStart = alignStartForHoldingRoom(
      form.start_time,
      form.end_time,
      previewNow,
    );
    const schedule = alignedStart
      ? { start_time: alignedStart, end_time: form.end_time }
      : buildFutureHoldingSchedule(previewNow);

    const saved = await persistConfig({ ...form, ...schedule });
    if (saved) {
      setStatus(
        alignedStart
          ? "Holding room restored — go-live moved before your stream end and saved."
          : "Holding room restored on /live — start moved 14 days ahead and saved.",
      );
    }
  };

  const handleReset = () => {
    setForm(DEFAULT_COUNTDOWN_CONFIG);
    setStatus("Reset to defaults. Save to publish.");
    setError(null);
  };

  return (
    <main className="min-h-dvh w-full bg-brand-black pt-safe pb-safe text-white">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[min(40vh,22rem)] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,168,255,0.12),transparent)]" />

      <section className="relative border-b border-brand-border px-4 pb-8 pt-4 md:px-8 lg:px-10">
        <div className="relative mx-auto w-full max-w-xl">
          <div
            className="pointer-events-none absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(0,168,255,0.14),transparent_70%)] blur-2xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto aspect-[3/2] w-full">
            <Image
              src={EXPERIENCE_BRAND_ASSETS.lockup}
              alt="300 Awakening"
              fill
              priority
              sizes="(max-width: 640px) 90vw, 576px"
              className="object-contain"
            />
          </div>
        </div>

        <div className="mx-auto mt-6 flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
          <Link
            href="/ops"
            prefetch={false}
            className="inline-flex min-h-11 items-center gap-2 font-ui text-[0.62rem] font-bold uppercase tracking-[0.16em] text-brand-muted transition hover:text-brand-blue"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to Ops
          </Link>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleRestoreHoldingRoom()}
              disabled={isSaving}
              className={`${actionButtonClassName} border-brand-blue/40 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20`}
            >
              Restore Holding Room
            </button>
            <button
              type="button"
              onClick={handleReset}
              className={`${actionButtonClassName} border-brand-border bg-brand-panel text-brand-muted hover:border-brand-blue/30 hover:text-white`}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className={`${actionButtonClassName} border-brand-pink/50 bg-brand-pink/15 text-white hover:bg-brand-pink/25`}
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Save Changes
            </button>
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-2xl text-center">
          <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.28em] text-brand-blue">
            Ops Console
          </p>
          <h1 className="mt-2 font-headline text-fluid-section uppercase tracking-[0.12em]">
            Countdown Hero Editor
          </h1>
          <p className="mt-3 font-body text-sm text-brand-muted">
            Configure the attendee holding-room hero on{" "}
            <span className="text-white">/live</span>. Signed in as{" "}
            <span className="text-brand-blue">{adminEmail}</span>.
          </p>
        </div>

        {(status || error) && (
          <div
            className={`mx-auto mt-6 max-w-2xl rounded-xl border px-4 py-3 text-center font-body text-sm ${
              error
                ? "border-red-500/40 bg-red-500/10 text-red-200"
                : "border-brand-blue/40 bg-brand-blue/10 text-brand-blue"
            }`}
            role="status"
          >
            {error ?? status}
          </div>
        )}
      </section>

      <div className="relative w-full px-4 py-6 md:px-8 lg:px-10">

        <div className={`${PAGE_GRID} items-start`}>
          <div className="md:col-span-5 xl:col-span-5">
            <div className="space-y-6">
              <section className="glass-panel rounded-2xl border border-brand-border p-5 sm:p-6">
                <SectionHeader icon={<Type className="h-4 w-4" />} title="Hero Copy" />

                <div className="space-y-4">
                  <label className="block">
                    <FieldLabel>Eyebrow</FieldLabel>
                    <input
                      className={inputClassName}
                      value={form.eyebrow}
                      onChange={(e) => updateField("eyebrow", e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <FieldLabel>Headline</FieldLabel>
                    <input
                      className={inputClassName}
                      value={form.headline}
                      onChange={(e) => updateField("headline", e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <FieldLabel>Subtitle</FieldLabel>
                    <input
                      className={inputClassName}
                      value={form.subtitle}
                      onChange={(e) => updateField("subtitle", e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <FieldLabel>Status Label</FieldLabel>
                    <input
                      className={inputClassName}
                      value={form.status_label}
                      onChange={(e) => updateField("status_label", e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <FieldLabel>Helper Text</FieldLabel>
                    <input
                      className={inputClassName}
                      value={form.helper_text}
                      onChange={(e) => updateField("helper_text", e.target.value)}
                    />
                  </label>
                </div>
              </section>

              <section className="glass-panel rounded-2xl border border-brand-border p-5 sm:p-6">
                <SectionHeader icon={<CalendarClock className="h-4 w-4" />} title="Schedule" />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <FieldLabel>Countdown Start</FieldLabel>
                    <input
                      type="datetime-local"
                      className={inputClassName}
                      value={toDatetimeLocalValue(form.start_time)}
                      onChange={(e) => {
                        const iso = parseDatetimeLocalInput(e.target.value);
                        if (iso) updateField("start_time", iso);
                      }}
                    />
                    <div className="mt-3 flex items-stretch gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-brand-border bg-brand-panel/60 px-3 py-2.5">
                        <Clock className="h-4 w-4 shrink-0 text-brand-blue" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
                            Current time
                          </p>
                          <p className="truncate font-mono text-xs tabular-nums text-white">
                            {currentTimeDisplay}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={applyCurrentTimeAsStart}
                        title="Set countdown start to current time"
                        aria-label="Set countdown start to current time"
                        className={`touch-target inline-flex min-h-11 min-w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-2 transition ${
                          startMatchesCurrentTime
                            ? "border-brand-blue/50 bg-brand-blue/15 text-brand-blue"
                            : "border-brand-border bg-brand-panel text-brand-muted hover:border-brand-blue/30 hover:text-white"
                        }`}
                      >
                        <Check
                          className={`h-4 w-4 ${startMatchesCurrentTime ? "opacity-100" : "opacity-70"}`}
                          aria-hidden="true"
                        />
                        <span className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.1em]">
                          Set
                        </span>
                      </button>
                    </div>
                    {startMatchesCurrentTime ? (
                      <p className="mt-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.14em] text-brand-blue">
                        Start matches current time
                      </p>
                    ) : null}
                    {previewPhase === "live" ? (
                      <p className="mt-3 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 font-ui text-[0.52rem] font-bold uppercase leading-relaxed tracking-[0.12em] text-amber-200">
                        Start time has passed — attendees on /live see the live stream, not the
                        holding room. Move Countdown Start to a future date to restore the holding
                        page.
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <FieldLabel>Countdown End</FieldLabel>
                    <input
                      type="datetime-local"
                      className={inputClassName}
                      value={toDatetimeLocalValue(form.end_time)}
                      onChange={(e) => {
                        const iso = parseDatetimeLocalInput(e.target.value);
                        if (!iso) return;

                        setForm((current) => {
                          const alignedStart = alignStartForHoldingRoom(
                            current.start_time,
                            iso,
                            previewNow,
                          );
                          const next = { ...current, end_time: iso };
                          if (!alignedStart) return next;
                          return { ...next, start_time: alignedStart };
                        });
                        setStatus(null);
                        setError(null);
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <FieldLabel>Waiting CTA Label</FieldLabel>
                    <input
                      className={inputClassName}
                      value={form.cta_label_waiting}
                      onChange={(e) => updateField("cta_label_waiting", e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <FieldLabel>Live CTA Label</FieldLabel>
                    <input
                      className={inputClassName}
                      value={form.cta_label_live}
                      onChange={(e) => updateField("cta_label_live", e.target.value)}
                    />
                  </label>
                </div>
              </section>

              <section className="glass-panel rounded-2xl border border-brand-border p-5 sm:p-6">
                <SectionHeader
                  icon={<ImageIcon className="h-4 w-4" />}
                  title="Asset Paths"
                  accent="pink"
                />

                <div className="space-y-4">
                  <label className="block">
                    <FieldLabel>Hero Background</FieldLabel>
                    <input
                      className={inputClassName}
                      value={form.hero_background_url}
                      onChange={(e) => updateField("hero_background_url", e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <FieldLabel>Countdown Frame</FieldLabel>
                    <input
                      className={inputClassName}
                      value={form.countdown_frame_url}
                      onChange={(e) => updateField("countdown_frame_url", e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <FieldLabel>Waiting Signal Pill</FieldLabel>
                    <input
                      className={inputClassName}
                      value={form.waiting_pill_url}
                      onChange={(e) => updateField("waiting_pill_url", e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <FieldLabel>Button Frame</FieldLabel>
                    <input
                      className={inputClassName}
                      value={form.button_frame_url}
                      onChange={(e) => updateField("button_frame_url", e.target.value)}
                    />
                  </label>
                </div>

                <label className="mt-5 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-brand-border bg-brand-panel/60 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => updateField("is_active", e.target.checked)}
                    className="h-4 w-4 accent-brand-pink"
                  />
                  <span className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white">
                    Active on attendee dashboard
                  </span>
                </label>
              </section>
            </div>
          </div>

          <aside className="md:col-span-7 xl:col-span-7">
            <section className="glass-panel sticky top-6 rounded-2xl border border-brand-border p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-brand-pink" aria-hidden="true" />
                  <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-white">
                    Live Preview
                  </h2>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 font-ui text-[0.52rem] font-bold uppercase tracking-[0.14em] ${phaseBadgeClass}`}
                >
                  Phase: {previewPhase}
                </span>
              </div>

              <p className="mb-5 font-ui text-[0.52rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
                Attendee /live: {attendeeLiveSurface}
              </p>

              <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-panel/80">
                <div className="border-b border-brand-border bg-brand-black/60 px-4 py-3">
                  <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.18em] text-brand-blue">
                    {form.eyebrow || "Eyebrow"}
                  </p>
                </div>

                <div className="space-y-4 px-4 py-6 sm:px-6">
                  <p className="font-headline text-[clamp(1.25rem,3vw,1.75rem)] uppercase leading-tight tracking-[0.08em] text-white">
                    {form.headline || "Headline"}
                  </p>
                  <p className="font-body text-xs uppercase tracking-[0.12em] text-brand-muted">
                    {form.subtitle || "Subtitle"}
                  </p>

                  {shouldShowCountdownTimer(form, false) && previewPhase === "waiting" ? (
                    <div className="py-2">
                      <LobbyCountdownTimer
                        config={form}
                        countdown={previewCountdown}
                        eventPhase={previewPhase}
                        showTimer
                        variant="hms"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-brand-border/80 px-4 py-8 text-center">
                      <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
                        {previewPhase === "live"
                          ? "Countdown hidden — live stream active"
                          : "Countdown not shown in this phase"}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <span
                      className={`inline-flex min-h-11 items-center rounded-full border px-5 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] ${
                        previewCta.disabled
                          ? "border-brand-border bg-brand-panel text-brand-muted"
                          : "border-brand-pink/40 bg-brand-pink/10 text-brand-pink"
                      }`}
                    >
                      {previewCta.label}
                    </span>
                    {previewCta.disabled ? (
                      <span className="font-ui text-[0.48rem] uppercase tracking-[0.12em] text-brand-muted">
                        (disabled in preview)
                      </span>
                    ) : null}
                  </div>

                  {form.helper_text ? (
                    <p className="border-t border-brand-border pt-4 font-body text-xs leading-relaxed text-brand-muted">
                      {form.helper_text}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
