"use client";

import { TS } from "@/components/todays-service/ServiceUi";
import { useAccessibleModal } from "@/components/todays-service/useAccessibleModal";

type DeleteConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
  confirming?: boolean;
  confirmLabel?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  tertiaryLabel?: string;
  onTertiary?: () => void;
};

export default function DeleteConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onClose,
  confirming = false,
  confirmLabel = "Delete",
  secondaryLabel,
  onSecondary,
  tertiaryLabel,
  onTertiary,
}: DeleteConfirmDialogProps) {
  const { titleId, panelRef, dialogProps } = useAccessibleModal(open, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div ref={panelRef} {...dialogProps} className={`${TS.panel} w-full max-w-md rounded-xl p-5`}>
        <h2 id={titleId} className="font-headline text-lg uppercase tracking-[0.1em] text-white">
          {title}
        </h2>
        <p className="mt-2 whitespace-pre-line font-body text-sm text-neutral-300">{message}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={confirming}
            onClick={onConfirm}
            className="touch-target rounded-md border border-red-500/40 bg-red-600/80 px-4 py-2 font-ui text-[0.55rem] font-bold uppercase tracking-[0.1em] text-white"
          >
            {confirming ? "Working…" : confirmLabel}
          </button>
          <button type="button" onClick={onClose} className={TS.btnOutline}>
            Cancel
          </button>
          {tertiaryLabel && onTertiary ? (
            <button type="button" disabled={confirming} onClick={onTertiary} className={TS.btnOutline}>
              {tertiaryLabel}
            </button>
          ) : null}
          {secondaryLabel && onSecondary ? (
            <button type="button" disabled={confirming} onClick={onSecondary} className={TS.btnBlue}>
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
