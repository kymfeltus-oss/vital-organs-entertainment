"use client";

import { CalendarClock, Clock } from "lucide-react";
import type { HeroCopyFormState } from "@/lib/broadcast/countdown-console-types";
import { countdownAdminInputClassName } from "@/components/ops/CountdownAdminPanels";

const TIMEZONE_OPTIONS = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "UTC",
] as const;

type ShowSchedulePanelProps = {
  formState: HeroCopyFormState;
  canEdit: boolean;
  onFieldChange: <K extends keyof HeroCopyFormState>(
    key: K,
    value: HeroCopyFormState[K],
  ) => void;
};

export default function ShowSchedulePanel({
  formState,
  canEdit,
  onFieldChange,
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
            {TIMEZONE_OPTIONS.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
