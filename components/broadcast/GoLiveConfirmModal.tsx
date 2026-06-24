"use client";

import { AlertTriangle, Loader2, ShieldAlert, X } from "lucide-react";

type GoLiveConfirmModalProps = {
  isOpen: boolean;
  isLaunching: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function GoLiveConfirmModal({
  isOpen,
  isLaunching,
  onClose,
  onConfirm,
}: GoLiveConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-brand-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="countdown-go-live-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-panel p-5 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-brand-border pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-brand-pink" aria-hidden="true" />
            <h2
              id="countdown-go-live-title"
              className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.18em] text-brand-pink"
            >
              Confirm Production Launch
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLaunching}
            className="touch-target text-brand-muted transition-colors hover:text-white disabled:opacity-40"
            aria-label="Close go live dialog"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-4 font-body text-sm leading-relaxed text-brand-muted">
          Are you sure you want to drop the runway gate and broadcast live to attendees? This runs
          the production go-live sequence and opens the public live experience.
        </p>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
          <p className="font-body text-xs leading-relaxed text-amber-200">
            This updates platform stream state and may sync the attendee countdown schedule. It
            cannot be silently reversed without a production interruption.
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLaunching}
            className="touch-target rounded-xl border border-brand-border bg-brand-black/60 px-4 py-2.5 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-brand-muted transition-colors hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLaunching}
            className="touch-target inline-flex items-center gap-2 rounded-xl border border-brand-pink/50 bg-brand-pink/20 px-4 py-2.5 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-brand-pink/30 disabled:opacity-40"
          >
            {isLaunching ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            <span>{isLaunching ? "Launching…" : "Yes, Launch Show"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
