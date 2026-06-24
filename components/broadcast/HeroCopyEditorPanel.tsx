"use client";

import type { HeroCopyFieldKey, HeroCopyFormState } from "@/lib/broadcast/countdown-console-types";
import { HERO_FIELD_LIMITS } from "@/lib/broadcast/countdown-console-types";
import { countdownAdminInputClassName } from "@/components/ops/CountdownAdminPanels";
import { CheckCircle2, Loader2, Save, Type } from "lucide-react";

type HeroCopyEditorPanelProps = {
  formState: HeroCopyFormState;
  canEdit: boolean;
  canSave: boolean;
  isSaving: boolean;
  saveSuccess: boolean;
  saveError: string | null;
  onFieldChange: <K extends keyof HeroCopyFormState>(
    key: K,
    value: HeroCopyFormState[K],
  ) => void;
  onSave: () => void;
  showSaveButton?: boolean;
};

const FIELDS: { key: HeroCopyFieldKey; label: string }[] = [
  { key: "eyebrow", label: "Eyebrow Text" },
  { key: "headline", label: "Headline Text" },
  { key: "subtitle", label: "Subtitle Text" },
  { key: "statusLabel", label: "Status Label" },
];

export default function HeroCopyEditorPanel({
  formState,
  canEdit,
  canSave,
  isSaving,
  saveSuccess,
  saveError,
  onFieldChange,
  onSave,
  showSaveButton = true,
}: HeroCopyEditorPanelProps) {
  return (
    <section className="glass-panel rounded-2xl border border-brand-border p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-brand-border pb-3">
        <Type className="h-4 w-4 text-brand-blue" aria-hidden="true" />
        <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white">
          Hero Copy Editor
        </h2>
      </div>

      <div className="space-y-4">
        {FIELDS.map(({ key, label }) => {
          const limit = HERO_FIELD_LIMITS[key];
          const value = formState[key];
          return (
            <label key={key} className="block">
              <span className="mb-1.5 flex items-center justify-between font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
                {label}
                <span className="tabular-nums">
                  {value.length}/{limit}
                </span>
              </span>
              <input
                className={countdownAdminInputClassName}
                value={value}
                maxLength={limit}
                disabled={!canEdit}
                onChange={(event) => onFieldChange(key, event.target.value)}
              />
            </label>
          );
        })}
      </div>

      {saveError ? (
        <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 font-body text-xs text-red-200">
          {saveError}
        </p>
      ) : null}

      {showSaveButton ? (
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave || isSaving}
          aria-label="Save hero copy"
          className="touch-target mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand-pink/50 bg-brand-pink/15 px-4 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white transition enabled:hover:bg-brand-pink/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : saveSuccess ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{!canSave ? "Read Only" : isSaving ? "Saving…" : saveSuccess ? "Saved" : "Save"}</span>
        </button>
      ) : null}
    </section>
  );
}
