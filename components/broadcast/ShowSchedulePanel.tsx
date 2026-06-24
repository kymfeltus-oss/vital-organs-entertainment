"use client";

import { CalendarClock, Clock, Loader2, RotateCcw, Save } from "lucide-react";
import type { HeroCopyFormState } from "@/lib/broadcast/countdown-console-types";
import { countdownAdminInputClassName } from "@/components/ops/CountdownAdminPanels";
import { SCHEDULE_TIMEZONE_OPTIONS } from "@/lib/live/schedule-timezone";

type ShowSchedulePanelProps = {
  formState: HeroCopyFormState;
  canEdit: boolean;
  canSave: boolean;
  isSaving: boolean;
  saveSuccess: boolean;
  saveError?: string | null;
  onFieldChange: <K extends keyof HeroCopyFormState>(
    key: K,
    value: HeroCopyFormState[K],
  ) => void;
  onSave: () => void;
  onReset: () => void;
  showActions?: boolean;
};

export default function ShowSchedulePanel({
  formState,
  canEdit,
  canSave,
  isSaving,
  saveSuccess,
  saveError = null,
  onFieldChange,
  onSave,
  onReset,
  showActions = true,
}: ShowSchedulePanelProps) {
  return (
    <section className="glass-panel rounded-2xl border border-brand-border p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-brand-border pb-3">
        <CalendarClock className="h-4 w-4 text-brand-purple" aria-hidden="true" />
        <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white">
          Show Schedule
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <label className="block">
          <span className="mb-1.5 block font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Show Date
          </span>
          <input
            type="date"
            className={countdownAdminInputClassName}
            value={formState.showDate}
            disabled={!canEdit}
            onChange={(event) => onFieldChange("showDate", event.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            Show Time Local
          </span>
          <input
            type="time"
            className={countdownAdminInputClassName}
            value={formState.showTime}
            disabled={!canEdit}
            onChange={(event) => onFieldChange("showTime", event.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Timezone
          </span>
          <select
            className={countdownAdminInputClassName}
            value={formState.timezone}
            disabled={!canEdit}
            onChange={(event) => onFieldChange("timezone", event.target.value)}
          >
            {SCHEDULE_TIMEZONE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {saveError ? (
        <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 font-body text-xs text-red-200">
          {saveError}
        </p>
      ) : null}

      {showActions ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave || isSaving}
            aria-label="Save countdown schedule and hero copy"
            className="touch-target col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-brand-purple/50 bg-brand-purple/20 px-4 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white transition enabled:hover:bg-brand-purple/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            <span>
              {!canSave
                ? "Read Only"
                : isSaving
                  ? "Saving…"
                  : saveSuccess
                    ? "Saved"
                    : "Save Changes"}
            </span>
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={!canEdit || isSaving}
            aria-label="Reset form to last saved server state"
            className="touch-target col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-brand-border bg-brand-panel px-4 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-brand-muted transition enabled:hover:border-brand-blue/30 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </button>
        </div>
      ) : null}
    </section>
  );
}
