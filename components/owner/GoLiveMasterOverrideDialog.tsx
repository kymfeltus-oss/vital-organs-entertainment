"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2, CheckCircle2, XCircle } from "lucide-react";

export type GoLiveFeedback = {
  kind: "success" | "error";
  message: string;
  detail?: string | null;
};

type GoLiveMasterOverrideDialogProps = {
  open: boolean;
  isConfirming: boolean;
  scheduledLabel: string;
  feedback: GoLiveFeedback | null;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  onDismissFeedback: () => void;
};

export default function GoLiveMasterOverrideDialog({
  open,
  isConfirming,
  scheduledLabel,
  feedback,
  onCancel,
  onConfirm,
  onDismissFeedback,
}: GoLiveMasterOverrideDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCancel = useCallback(() => {
    if (isConfirming) return;
    if (feedback?.kind === "success") {
      onDismissFeedback();
      return;
    }
    onCancel();
  }, [feedback?.kind, isConfirming, onCancel, onDismissFeedback]);

  const showResult = feedback !== null && !isConfirming;

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleCancel();
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, handleCancel]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      confirmRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      data-testid="override-modal"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Dismiss go live override dialog"
        disabled={isConfirming}
        onClick={handleCancel}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm disabled:cursor-not-allowed"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-[201] flex w-full max-w-md max-h-[min(90dvh,calc(100dvh-2rem))] flex-col overflow-hidden rounded-xl border border-amber-300/35 bg-[#050814] shadow-[0_0_40px_rgba(255,193,7,0.12)]"
      >
        <div className="flex-1 overflow-y-auto p-5">
          {showResult ? (
            <div
              data-testid="go-live-result"
              role="status"
              aria-live="polite"
              className={`rounded-lg border px-4 py-4 ${
                feedback.kind === "success"
                  ? "border-lime-300/40 bg-lime-300/10"
                  : "border-red-400/40 bg-red-500/10"
              }`}
            >
              <div className="flex items-start gap-3">
                {feedback.kind === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-lime-300" aria-hidden="true" />
                ) : (
                  <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-300" aria-hidden="true" />
                )}
                <div className="min-w-0">
                  <h2
                    id={titleId}
                    className={`font-headline text-lg uppercase tracking-[0.06em] ${
                      feedback.kind === "success" ? "text-lime-200" : "text-red-200"
                    }`}
                  >
                    {feedback.kind === "success" ? "Go Live Active" : "Go Live Failed"}
                  </h2>
                  <p className="mt-2 font-body text-sm leading-relaxed text-white/85">{feedback.message}</p>
                  {feedback.detail ? (
                    <p className="mt-2 font-body text-xs leading-relaxed text-white/55">{feedback.detail}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-300" aria-hidden="true" />
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="font-headline text-xl uppercase tracking-[0.06em] text-white"
                >
                  Master Go Live Override
                </h2>
                <p id={descriptionId} className="mt-3 font-body text-sm leading-relaxed text-white/72">
                  This will permanently override the scheduled event date and time, move the countdown to{" "}
                  <strong className="text-white">right now</strong>, and force the broadcast live for
                  attendees.
                </p>
                <p className="mt-2 rounded-md border border-white/10 bg-black/35 px-3 py-2 font-body text-xs text-white/55">
                  Current schedule: {scheduledLabel}
                </p>
                <p className="mt-2 font-body text-xs text-amber-200/90">
                  This action cannot undo the previous scheduled go-live time. Adjust the schedule manually
                  if you need to revert.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-white/10 bg-[#050814] p-4 sm:flex-row sm:justify-end">
          {showResult ? (
            feedback.kind === "success" ? (
              <button
                ref={confirmRef}
                type="button"
                onClick={onDismissFeedback}
                className="min-h-11 rounded-md bg-gradient-to-br from-lime-400 to-green-700 px-4 font-ui text-xs font-black uppercase tracking-[0.1em] text-black shadow-[0_0_18px_rgba(85,255,75,0.28)]"
              >
                Done
              </button>
            ) : (
              <>
                <button
                  ref={cancelRef}
                  type="button"
                  onClick={onCancel}
                  className="min-h-11 rounded-md border border-white/15 bg-white/5 px-4 font-ui text-xs font-bold uppercase tracking-[0.1em] text-white/70 transition hover:bg-white/10"
                >
                  Close
                </button>
                <button
                  ref={confirmRef}
                  type="button"
                  onClick={() => void onConfirm()}
                  className="min-h-11 rounded-md bg-gradient-to-br from-lime-400 to-green-700 px-4 font-ui text-xs font-black uppercase tracking-[0.1em] text-black shadow-[0_0_18px_rgba(85,255,75,0.28)]"
                >
                  Try Again
                </button>
              </>
            )
          ) : (
            <>
              <button
                ref={cancelRef}
                type="button"
                disabled={isConfirming}
                onClick={handleCancel}
                className="min-h-11 rounded-md border border-white/15 bg-white/5 px-4 font-ui text-xs font-bold uppercase tracking-[0.1em] text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Cancel
              </button>
              <button
                ref={confirmRef}
                type="button"
                disabled={isConfirming}
                data-loading={isConfirming || undefined}
                aria-busy={isConfirming || undefined}
                onClick={() => void onConfirm()}
                className="min-h-11 rounded-md bg-gradient-to-br from-lime-400 to-green-700 px-4 font-ui text-xs font-black uppercase tracking-[0.1em] text-black shadow-[0_0_18px_rgba(85,255,75,0.28)] transition-opacity duration-200 disabled:cursor-not-allowed disabled:opacity-45 data-[loading=true]:pointer-events-none data-[loading=true]:opacity-45"
              >
                {isConfirming ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Confirming...
                  </span>
                ) : (
                  "Confirm Go Live"
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
