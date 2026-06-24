"use client";

import { CalendarClock, Clock, Sparkles } from "lucide-react";
import {
  CountdownAdminFieldLabel,
  CountdownAdminSectionHeader,
  countdownAdminInputClassName,
} from "@/components/ops/CountdownAdminPanels";
import type { EventCountdownConfig, EventCountdownPhase } from "@/lib/live/countdown-config";
import {
  buildGoLiveAtOffsetMinutes,
  formatCountdownUntilGoLive,
  GO_LIVE_PRESET_MINUTES,
} from "@/lib/live/countdown-schedule-helpers";
import {
  getScheduleTimezoneLabel,
  SCHEDULE_TIMEZONE_OPTIONS,
  type ScheduleTimezone,
} from "@/lib/live/schedule-timezone";

const scheduleInputClassName = `${countdownAdminInputClassName} countdown-admin-datetime [color-scheme:dark]`;

const presetButtonClassName =
  "touch-target rounded-lg border border-brand-border bg-brand-panel px-3 py-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.12em] text-brand-muted transition hover:border-brand-blue/35 hover:text-brand-blue disabled:opacity-40";

type CountdownAdminScheduleFieldsProps = {
  form: EventCountdownConfig;
  previewPhase: EventCountdownPhase;
  currentTimeDisplay: string;
  countdownRemainingLabel: string;
  goLiveLocal: string;
  showEndLocal: string;
  scheduleTimezone: ScheduleTimezone;
  readOnly?: boolean;
  variant?: "mobile" | "desktop";
  onGoLiveLocalChange: (raw: string, iso: string | null) => void;
  onShowEndLocalChange: (raw: string, iso: string | null) => void;
  onApplyGoLivePreset: (minutesFromNow: number) => void;
  onScheduleTimezoneChange: (timeZone: ScheduleTimezone) => void;
  updateField: <K extends keyof EventCountdownConfig>(
    key: K,
    value: EventCountdownConfig[K],
  ) => void;
};

export default function CountdownAdminScheduleFields({
  form,
  previewPhase,
  currentTimeDisplay,
  countdownRemainingLabel,
  goLiveLocal,
  showEndLocal,
  scheduleTimezone,
  readOnly = false,
  variant = "desktop",
  onGoLiveLocalChange,
  onShowEndLocalChange,
  onApplyGoLivePreset,
  onScheduleTimezoneChange,
  updateField,
}: CountdownAdminScheduleFieldsProps) {
  const sectionClass =
    variant === "mobile"
      ? "glass-panel rounded-2xl border border-brand-border p-4"
      : "glass-panel rounded-2xl border border-brand-border p-5 sm:p-6";

  return (
    <section className={sectionClass}>
      <CountdownAdminSectionHeader
        icon={<CalendarClock className="h-4 w-4" />}
        title="Countdown Clock"
      />

      <div className="space-y-5">
        <div className="rounded-xl border border-brand-blue/30 bg-brand-blue/8 px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.16em] text-brand-blue">
                Clock always starts from now
              </p>
              <p className="mt-2 flex items-center gap-2 font-mono text-sm tabular-nums text-white">
                <Clock className="h-4 w-4 shrink-0 text-brand-blue" aria-hidden="true" />
                {currentTimeDisplay}
              </p>
            </div>
            <div className="text-right">
              <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
                Time until show
              </p>
              <p className="mt-2 font-mono text-sm font-semibold tabular-nums text-brand-pink">
                {countdownRemainingLabel}
              </p>
            </div>
          </div>
          <p className="mt-3 font-body text-[0.65rem] leading-relaxed text-brand-muted">
            The holding-room countdown runs from the current moment until{" "}
            <span className="text-white">Go Live At</span>. Schedule times in the
            event timezone below — not your local laptop clock.
          </p>
        </div>

        <label className="block">
          <CountdownAdminFieldLabel>Event Timezone</CountdownAdminFieldLabel>
          <select
            className={scheduleInputClassName}
            value={scheduleTimezone}
            disabled={readOnly}
            onChange={(event) =>
              onScheduleTimezoneChange(event.target.value as ScheduleTimezone)
            }
          >
            {SCHEDULE_TIMEZONE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-2 font-body text-[0.65rem] leading-relaxed text-brand-muted">
            Go Live At and Show Ends use{" "}
            <span className="text-white">{getScheduleTimezoneLabel(scheduleTimezone)}</span>.
            Attendees still see the correct countdown regardless of where you operate from.
          </p>
        </label>

        <div>
          <CountdownAdminFieldLabel>Go Live At — show starts</CountdownAdminFieldLabel>
          <input
            type="datetime-local"
            className={scheduleInputClassName}
            value={goLiveLocal}
            disabled={readOnly}
            onChange={(e) => onGoLiveLocalChange(e.target.value, null)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {GO_LIVE_PRESET_MINUTES.map((minutes) => (
              <button
                key={minutes}
                type="button"
                disabled={readOnly}
                className={presetButtonClassName}
                onClick={() => onApplyGoLivePreset(minutes)}
              >
                +{minutes} min
              </button>
            ))}
          </div>
          {previewPhase === "live" ? (
            <p className="mt-3 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 font-ui text-[0.52rem] font-bold uppercase leading-relaxed tracking-[0.12em] text-amber-200">
              Go-live time has passed — attendees on /live see the live stream. Set Go Live
              At to a future time (or use Restore Holding Room) to bring back the countdown.
            </p>
          ) : null}
        </div>

        <div>
          <CountdownAdminFieldLabel>Show Ends — outro starts</CountdownAdminFieldLabel>
          <input
            type="datetime-local"
            className={scheduleInputClassName}
            value={showEndLocal}
            disabled={readOnly}
            onChange={(e) => onShowEndLocalChange(e.target.value, null)}
          />
          <p className="mt-2 font-body text-[0.65rem] leading-relaxed text-brand-muted">
            When the broadcast closes, attendees see the outro screen on /live. Must be
            after go-live. Click <span className="text-white">Save Changes</span> to publish.
          </p>
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
  );
}

type CountdownAdminOutroFieldsProps = {
  form: EventCountdownConfig;
  readOnly?: boolean;
  variant?: "mobile" | "desktop";
  updateField: <K extends keyof EventCountdownConfig>(
    key: K,
    value: EventCountdownConfig[K],
  ) => void;
};

export function CountdownAdminOutroFields({
  form,
  readOnly = false,
  variant = "desktop",
  updateField,
}: CountdownAdminOutroFieldsProps) {
  const sectionClass =
    variant === "mobile"
      ? "glass-panel rounded-2xl border border-brand-border p-4"
      : "glass-panel rounded-2xl border border-brand-border p-5 sm:p-6";

  return (
    <section className={sectionClass}>
      <CountdownAdminSectionHeader
        icon={<Sparkles className="h-4 w-4" />}
        title="Outro"
        accent="pink"
      />
      <p className="-mt-2 mb-4 font-body text-[0.65rem] leading-relaxed text-brand-muted">
        Shown on /live after Show Ends. Thank-you message and status for attendees when
        the event is over.
      </p>
      <div className="space-y-4">
        <label className="block">
          <CountdownAdminFieldLabel>Outro Status Label</CountdownAdminFieldLabel>
          <input
            className={countdownAdminInputClassName}
            value={form.outro_status_label}
            disabled={readOnly}
            onChange={(e) => updateField("outro_status_label", e.target.value)}
          />
        </label>
        <label className="block">
          <CountdownAdminFieldLabel>Outro Headline</CountdownAdminFieldLabel>
          <input
            className={countdownAdminInputClassName}
            value={form.outro_headline}
            disabled={readOnly}
            onChange={(e) => updateField("outro_headline", e.target.value)}
          />
        </label>
        <label className="block">
          <CountdownAdminFieldLabel>Outro Message</CountdownAdminFieldLabel>
          <input
            className={countdownAdminInputClassName}
            value={form.outro_subtitle}
            disabled={readOnly}
            onChange={(e) => updateField("outro_subtitle", e.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
