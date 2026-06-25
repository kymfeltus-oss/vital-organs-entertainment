"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TS } from "@/components/todays-service/ServiceUi";
import { useAccessibleModal } from "@/components/todays-service/useAccessibleModal";
import type { ServiceHeaderUpdate } from "@/lib/todays-service/service-header";
import { validateServiceHeaderUpdate } from "@/lib/todays-service/service-header";
import type { ServiceRecord } from "@/lib/todays-service/types";
import { serviceRecordToHeaderUpdate } from "@/lib/todays-service/service-header";

type EditServiceModalProps = {
  open: boolean;
  service: ServiceRecord;
  saving?: boolean;
  saveError?: string | null;
  onClose: () => void;
  onSave: (patch: ServiceHeaderUpdate) => Promise<{ success: boolean; error?: string }>;
};

export default function EditServiceModal({
  open,
  service,
  saving = false,
  saveError = null,
  onClose,
  onSave,
}: EditServiceModalProps) {
  const [form, setForm] = useState<ServiceHeaderUpdate>(() => serviceRecordToHeaderUpdate(service));
  const [validationError, setValidationError] = useState<string | null>(null);
  const wasOpenRef = useRef(false);
  const { titleId, panelRef, dialogProps } = useAccessibleModal(open, onClose);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setForm(serviceRecordToHeaderUpdate(service));
      setValidationError(null);
    }
    wasOpenRef.current = open;
  }, [open, service]);

  if (!open) return null;

  const updateField = <K extends keyof ServiceHeaderUpdate>(key: K, value: ServiceHeaderUpdate[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setValidationError(null);
  };

  const handleSave = async () => {
    const error = validateServiceHeaderUpdate(form);
    if (error) {
      setValidationError(error);
      return;
    }

    const result = await onSave(form);
    if (result.success) {
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
      <div ref={panelRef} {...dialogProps} className={`${TS.panel} w-full max-w-lg rounded-xl p-5`}>
        <h2 id={titleId} className="font-headline text-lg uppercase tracking-[0.1em] text-white">
          Edit Service
        </h2>
        <p className="mt-1 font-body text-sm text-neutral-400">
          Update today&apos;s service name, schedule, broadcast profile, and message.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Service Name" htmlFor="edit-service-name" className="sm:col-span-2">
            <input
              id="edit-service-name"
              value={form.serviceName}
              onChange={(e) => updateField("serviceName", e.target.value)}
              className={TS.input}
              disabled={saving}
            />
          </Field>
          <Field label="Service Date" htmlFor="edit-service-date">
            <input
              id="edit-service-date"
              type="date"
              value={form.serviceDate}
              onChange={(e) => updateField("serviceDate", e.target.value)}
              className={TS.input}
              disabled={saving}
            />
          </Field>
          <Field label="Start Time" htmlFor="edit-service-time">
            <input
              id="edit-service-time"
              type="time"
              value={form.serviceStartTime}
              onChange={(e) => updateField("serviceStartTime", e.target.value)}
              className={TS.input}
              disabled={saving}
            />
          </Field>
          <Field label="Broadcast Profile" htmlFor="edit-service-profile" className="sm:col-span-2">
            <input
              id="edit-service-profile"
              value={form.broadcastProfile}
              onChange={(e) => updateField("broadcastProfile", e.target.value)}
              className={TS.input}
              disabled={saving}
            />
          </Field>
          <Field label="Service Message" htmlFor="edit-service-message" className="sm:col-span-2">
            <textarea
              id="edit-service-message"
              value={form.readinessMessage}
              onChange={(e) => updateField("readinessMessage", e.target.value)}
              className={`${TS.input} min-h-24`}
              disabled={saving}
            />
          </Field>
        </div>

        {(validationError ?? saveError) ? (
          <p className="mt-3 rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 font-body text-sm text-red-300">
            {validationError ?? saveError}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" disabled={saving} onClick={() => void handleSave()} className={TS.btnPrimary}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" disabled={saving} onClick={onClose} className={TS.btnOutline}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Field({
  label,
  children,
  className = "",
  htmlFor,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  htmlFor: string;
}) {
  return (
    <label htmlFor={htmlFor} className={`block ${className}`}>
      <span className={`mb-1 block ${TS.labelMuted} tracking-[0.1em]`}>{label}</span>
      {children}
    </label>
  );
}
