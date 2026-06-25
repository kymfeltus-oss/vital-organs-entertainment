"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { TS } from "@/components/todays-service/ServiceUi";
import { useAccessibleModal } from "@/components/todays-service/useAccessibleModal";

export type FormField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "select" | "number" | "checkbox" | "time" | "date";
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
};

type AddEditItemModalProps = {
  open: boolean;
  title: string;
  fields: FormField[];
  values: Record<string, unknown>;
  onChange: Dispatch<SetStateAction<Record<string, unknown>>>;
  onSave: () => void;
  onClose: () => void;
  saving?: boolean;
  saveLabel?: string;
  children?: React.ReactNode;
};

export default function AddEditItemModal({
  open,
  title,
  fields,
  values,
  onChange,
  onSave,
  onClose,
  saving = false,
  saveLabel = "Save",
  children,
}: AddEditItemModalProps) {
  const { titleId, panelRef, dialogProps } = useAccessibleModal(open, onClose);

  const setField = useCallback(
    (key: string, value: unknown) => {
      onChange((prev) => {
        const next = { ...prev, [key]: value };
        // #region agent log
        fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
          body: JSON.stringify({
            sessionId: "675ed0",
            location: "AddEditItemModal.tsx:setField",
            message: "field change",
            data: { key, valueType: typeof value, nameLen: key === "name" ? String(value).length : undefined },
            timestamp: Date.now(),
            hypothesisId: "B",
            runId: "sound-modal",
          }),
        }).catch(() => {});
        // #endregion
        return next;
      });
    },
    [onChange],
  );

  if (!open) return null;

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
      <div
        ref={panelRef}
        {...dialogProps}
        className={`${TS.panel} max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl p-5`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id={titleId} className="font-headline text-lg uppercase tracking-[0.1em] text-white">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="touch-target text-neutral-400 hover:text-white">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {fields.map((field) => {
            const fieldId = `modal-field-${field.key}`;
            return (
              <label key={field.key} htmlFor={fieldId} className="block">
                <span className={`mb-1 block ${TS.labelMuted} tracking-[0.08em]`}>
                  {field.label}
                  {field.required ? " *" : ""}
                </span>
                {field.type === "textarea" ? (
                  <textarea
                    id={fieldId}
                    value={String(values[field.key] ?? "")}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className={`${TS.input} min-h-24`}
                    placeholder={field.placeholder}
                  />
                ) : field.type === "select" ? (
                  <select
                    id={fieldId}
                    value={String(values[field.key] ?? "")}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className={TS.input}
                  >
                    {(field.options ?? []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "checkbox" ? (
                  <input
                    id={fieldId}
                    type="checkbox"
                    checked={Boolean(values[field.key])}
                    onChange={(e) => setField(field.key, e.target.checked)}
                    className="h-5 w-5 accent-[#53fc18]"
                  />
                ) : (
                  <input
                    id={fieldId}
                    type={field.type ?? "text"}
                    value={String(values[field.key] ?? "")}
                    onChange={(e) =>
                      setField(field.key, field.type === "number" ? Number(e.target.value) : e.target.value)
                    }
                    className={TS.input}
                    placeholder={field.placeholder}
                  />
                )}
              </label>
            );
          })}
          {children}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" disabled={saving} onClick={onSave} className={TS.btnPrimary}>
            {saving ? "Saving…" : saveLabel}
          </button>
          <button type="button" onClick={onClose} className={TS.btnOutline}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
