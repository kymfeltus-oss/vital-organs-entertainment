"use client";

import { CalendarClock, Check, Clock, ImageIcon, Sparkles, Type } from "lucide-react";
import LobbyCountdownTimer from "@/components/lobby/LobbyCountdownTimer";
import { shouldShowCountdownTimer } from "@/lib/experience/countdown-display";
import type { EventCountdownConfig, EventCountdownPhase } from "@/lib/live/countdown-config";
import type { CountdownParts } from "@/lib/live/event-lobby";
import { alignStartForHoldingRoom } from "@/lib/live/countdown-schedule-helpers";

export const countdownAdminInputClassName =
  "w-full min-h-11 rounded-xl border border-brand-border bg-brand-panel/80 px-4 py-3 font-body text-base text-white outline-none transition placeholder:text-brand-muted/45 focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/25 md:min-h-10 md:py-2.5 md:text-sm";

export const countdownAdminActionButtonClassName =
  "touch-target inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] transition disabled:opacity-60";

export function CountdownAdminFieldLabel({ children }: { children: string }) {
  return (
    <span className="mb-1.5 block font-ui text-[0.62rem] font-bold uppercase tracking-[0.18em] text-brand-muted">
      {children}
    </span>
  );
}

export function CountdownAdminSectionHeader({
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

type CountdownAdminLivePreviewProps = {
  form: EventCountdownConfig;
  previewPhase: EventCountdownPhase;
  previewCountdown: CountdownParts;
  attendeeLiveSurface: string;
  phaseBadgeClass: string;
  previewCta: { label: string; disabled: boolean };
  compact?: boolean;
  onRampLivePreview: () => void;
};

export function CountdownAdminLivePreview({
  form,
  previewPhase,
  previewCountdown,
  attendeeLiveSurface,
  phaseBadgeClass,
  previewCta,
  compact = false,
  onRampLivePreview,
}: CountdownAdminLivePreviewProps) {
  const frameClass = compact
    ? "relative aspect-video w-full"
    : "relative aspect-[9/16] w-full max-h-[min(72vh,40rem)] sm:aspect-[3/4] lg:aspect-[9/16] lg:max-h-none";

  return (
    <div className={compact ? "w-full" : "mx-auto w-full max-w-full overflow-hidden rounded-2xl border border-brand-border bg-brand-panel/80"}>
      {!compact ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-5 lg:px-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 shrink-0 text-brand-pink" aria-hidden="true" />
            <div>
              <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-white">
                Live Preview
              </h2>
              <p className="mt-1 font-ui text-[0.48rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
                Attendee /live: {attendeeLiveSurface}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRampLivePreview}
              className="touch-target inline-flex min-h-11 items-center rounded-full border border-brand-pink/50 bg-brand-pink/15 px-4 py-1.5 font-ui text-[0.52rem] font-bold uppercase tracking-[0.14em] text-brand-pink transition hover:bg-brand-pink/25"
            >
              Ramp Live
            </button>
            <span
              className={`rounded-full border px-3 py-1 font-ui text-[0.52rem] font-bold uppercase tracking-[0.14em] ${phaseBadgeClass}`}
            >
              Phase: {previewPhase}
            </span>
          </div>
        </div>
      ) : null}

      <div className={compact ? frameClass : `mx-auto px-4 pb-4 sm:px-5 lg:px-6 lg:pb-6 ${frameClass}`} aria-label="Attendee holding room preview">
        <div className="absolute inset-0 flex flex-col bg-brand-black/90">
          <div className="border-b border-brand-border bg-brand-black/60 px-3 py-2 text-center">
            <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.2em] text-brand-blue sm:text-[0.62rem]">
              {form.eyebrow.trim() || "YOU'RE ALMOST LIVE"}
            </p>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-3 py-3 text-center sm:gap-4 sm:px-4 sm:py-6">
            <p className="font-headline text-[clamp(0.85rem,3.5vw,1.75rem)] uppercase leading-tight tracking-[0.08em] text-white">
              {form.headline.trim() || "THE AWAKENING BEGINS SOON"}
            </p>
            {!compact ? (
              <p className="max-w-md font-body text-[clamp(0.65rem,2.8vw,0.75rem)] uppercase tracking-[0.12em] text-brand-muted">
                {form.subtitle.trim() || "Subtitle"}
              </p>
            ) : null}

            {form.status_label.trim() && !compact ? (
              <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.16em] text-brand-purple">
                {form.status_label}
              </p>
            ) : null}

            {!compact && shouldShowCountdownTimer(form, false) && previewPhase === "waiting" ? (
              <div className="w-full max-w-xs scale-[0.92] sm:scale-100">
                <LobbyCountdownTimer
                  config={form}
                  countdown={previewCountdown}
                  eventPhase={previewPhase}
                  showTimer
                  variant="hms"
                />
              </div>
            ) : !compact ? (
              <div className="w-full max-w-xs rounded-xl border border-dashed border-brand-border/80 px-3 py-6 sm:px-4 sm:py-8">
                <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.14em] text-brand-muted sm:text-[0.52rem]">
                  {previewPhase === "live"
                    ? "Countdown hidden — live stream active"
                    : "Countdown not shown in this phase"}
                </p>
              </div>
            ) : null}

            {!compact ? (
              <>
                <span
                  className={`inline-flex min-h-11 min-w-[min(100%,14rem)] items-center justify-center rounded-full border px-6 font-ui text-[clamp(0.52rem,2.5vw,0.58rem)] font-bold uppercase tracking-[0.12em] ${
                    previewCta.disabled
                      ? "cursor-not-allowed border-brand-border bg-brand-panel text-brand-muted"
                      : "border-brand-pink/40 bg-brand-pink/10 text-brand-pink"
                  }`}
                  aria-disabled={previewCta.disabled}
                >
                  {previewCta.label.trim() || "ENTER LIVE EXPERIENCE"}
                </span>

                {form.helper_text.trim() ? (
                  <p className="max-w-sm font-body text-[clamp(0.65rem,2.5vw,0.75rem)] leading-relaxed text-brand-muted">
                    {form.helper_text}
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

type CountdownAdminHeroScheduleFieldsProps = {
  form: EventCountdownConfig;
  previewPhase: EventCountdownPhase;
  currentTimeDisplay: string;
  startMatchesCurrentTime: boolean;
  readOnly: boolean;
  variant?: "mobile" | "desktop";
  updateField: <K extends keyof EventCountdownConfig>(
    key: K,
    value: EventCountdownConfig[K],
  ) => void;
  onApplyCurrentTimeAsStart: () => void;
  onEndTimeChange: (iso: string) => void;
  toDatetimeLocalValue: (iso: string) => string;
  parseDatetimeLocalInput: (raw: string) => string | null;
};

export function CountdownAdminHeroScheduleFields({
  form,
  previewPhase,
  currentTimeDisplay,
  startMatchesCurrentTime,
  readOnly,
  variant = "mobile",
  updateField,
  onApplyCurrentTimeAsStart,
  onEndTimeChange,
  toDatetimeLocalValue,
  parseDatetimeLocalInput,
}: CountdownAdminHeroScheduleFieldsProps) {
  const outerClass = variant === "mobile" ? "space-y-6 px-4 py-4" : "space-y-6";
  const sectionClass =
    variant === "mobile"
      ? "glass-panel rounded-2xl border border-brand-border p-4"
      : "glass-panel rounded-2xl border border-brand-border p-5 sm:p-6";

  return (
    <div className={outerClass}>
      <section className={sectionClass}>
        <CountdownAdminSectionHeader icon={<Type className="h-4 w-4" />} title="Hero Copy" />
        <div className="space-y-4">
          {(
            [
              ["eyebrow", "Eyebrow"],
              ["headline", "Headline"],
              ["subtitle", "Subtitle"],
              ["status_label", "Status Label"],
              ["helper_text", "Helper Text"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block">
              <CountdownAdminFieldLabel>{label}</CountdownAdminFieldLabel>
              <input
                className={countdownAdminInputClassName}
                value={form[key]}
                disabled={readOnly}
                onChange={(e) => updateField(key, e.target.value)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <CountdownAdminSectionHeader
          icon={<CalendarClock className="h-4 w-4" />}
          title="Schedule"
        />
        <div className="grid grid-cols-1 gap-4">
          <div>
            <CountdownAdminFieldLabel>Countdown Start</CountdownAdminFieldLabel>
            <input
              type="datetime-local"
              className={countdownAdminInputClassName}
              value={toDatetimeLocalValue(form.start_time)}
              disabled={readOnly}
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
                onClick={onApplyCurrentTimeAsStart}
                disabled={readOnly}
                title="Set countdown start to current time"
                aria-label="Set countdown start to current time"
                className={`touch-target inline-flex min-h-11 min-w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-2 transition disabled:opacity-40 ${
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
            {previewPhase === "live" ? (
              <p className="mt-3 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 font-ui text-[0.52rem] font-bold uppercase leading-relaxed tracking-[0.12em] text-amber-200">
                Start time has passed — attendees on /live see the live stream.
              </p>
            ) : null}
          </div>

          <div>
            <CountdownAdminFieldLabel>Countdown End</CountdownAdminFieldLabel>
            <input
              type="datetime-local"
              className={countdownAdminInputClassName}
              value={toDatetimeLocalValue(form.end_time)}
              disabled={readOnly}
              onChange={(e) => {
                const iso = parseDatetimeLocalInput(e.target.value);
                if (iso) onEndTimeChange(iso);
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <CountdownAdminFieldLabel>Waiting CTA Label</CountdownAdminFieldLabel>
              <input
                className={countdownAdminInputClassName}
                value={form.cta_label_waiting}
                disabled={readOnly}
                onChange={(e) => updateField("cta_label_waiting", e.target.value)}
              />
            </label>
            <label className="block">
              <CountdownAdminFieldLabel>Live CTA Label</CountdownAdminFieldLabel>
              <input
                className={countdownAdminInputClassName}
                value={form.cta_label_live}
                disabled={readOnly}
                onChange={(e) => updateField("cta_label_live", e.target.value)}
              />
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}

type CountdownAdminAssetFieldsProps = {
  form: EventCountdownConfig;
  readOnly?: boolean;
  updateField: <K extends keyof EventCountdownConfig>(
    key: K,
    value: EventCountdownConfig[K],
  ) => void;
};

export function CountdownAdminAssetFields({
  form,
  readOnly = false,
  updateField,
}: CountdownAdminAssetFieldsProps) {
  return (
    <section className="glass-panel rounded-2xl border border-brand-border p-5 sm:p-6">
      <CountdownAdminSectionHeader
        icon={<ImageIcon className="h-4 w-4" />}
        title="Asset Paths"
        accent="pink"
      />
      <div className="space-y-4">
        {(
          [
            ["hero_background_url", "Hero Background"],
            ["countdown_frame_url", "Countdown Frame"],
            ["waiting_pill_url", "Waiting Signal Pill"],
            ["button_frame_url", "Button Frame"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block">
            <CountdownAdminFieldLabel>{label}</CountdownAdminFieldLabel>
            <input
              className={countdownAdminInputClassName}
              value={form[key]}
              disabled={readOnly}
              onChange={(e) => updateField(key, e.target.value)}
            />
          </label>
        ))}
      </div>
      <label className="mt-5 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-brand-border bg-brand-panel/60 px-4 py-3">
        <input
          type="checkbox"
          checked={form.is_active}
          disabled={readOnly}
          onChange={(e) => updateField("is_active", e.target.checked)}
          className="h-4 w-4 accent-brand-pink"
        />
        <span className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white">
          Active on attendee dashboard
        </span>
      </label>
    </section>
  );
}

export function handleCountdownEndTimeChange(
  form: EventCountdownConfig,
  iso: string,
  previewNow: number,
): EventCountdownConfig {
  const alignedStart = alignStartForHoldingRoom(form.start_time, iso, previewNow);
  const next = { ...form, end_time: iso };
  if (!alignedStart) return next;
  return { ...next, start_time: alignedStart };
}
