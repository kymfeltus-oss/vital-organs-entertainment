"use client";

import { AlertTriangle, EyeOff, VolumeX, X } from "lucide-react";
import type { TroubleAlert } from "@/lib/broadcast/countdown-console-types";
import type { ChatTroubleCategory } from "@/lib/ops/chat-scanner";

type TroubleAlertPopupProps = {
  /** Legacy shape from countdown chat hook */
  issueType?: ChatTroubleCategory | null;
  count?: number;
  /** Spec shape from useTroubleAlertScanner */
  alert?: TroubleAlert | null;
  onClear: () => void;
  variant?: "desktop" | "mobile";
  canClear?: boolean;
};

export default function TroubleAlertPopup({
  issueType = null,
  count = 0,
  alert = null,
  onClear,
  variant = "desktop",
  canClear = true,
}: TroubleAlertPopupProps) {
  const activeType = alert?.type ?? issueType;
  const activeCount = alert?.count ?? count;

  if (!activeType || activeCount <= 0) return null;

  const positionClass =
    variant === "mobile"
      ? "bottom-24 inset-x-4 w-auto max-w-none"
      : "bottom-4 right-4 w-[min(100vw-2rem,22rem)]";

  const message =
    alert?.message ??
    (activeType === "audio"
      ? "Multiple viewers are reporting they CANNOT HEAR the broadcast right now!"
      : "Multiple viewers are reporting they CANNOT SEE the broadcast right now!");

  const fix =
    alert?.fix ??
    "Fix check: verify mixer faders, Restream ingest, and vMix encoder output.";

  return (
    <div
      className={`pointer-events-auto fixed z-[60] rounded-xl border border-amber-500/70 bg-brand-panel p-4 text-white shadow-2xl shadow-amber-500/10 motion-safe:animate-bounce ${positionClass}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400">
          {activeType === "audio" ? (
            <VolumeX className="h-5 w-5" aria-hidden="true" />
          ) : (
            <EyeOff className="h-5 w-5" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1 text-sm">
          <h4 className="flex items-center gap-1.5 font-ui text-[0.62rem] font-bold uppercase tracking-[0.16em] text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Audience Alert</span>
          </h4>
          <p className="mt-1 font-body text-sm font-medium leading-snug text-zinc-200">{message}</p>
          <p className="mt-2 font-body text-[0.68rem] italic leading-snug text-brand-muted">{fix}</p>
        </div>

        {canClear ? (
          <button
            type="button"
            onClick={onClear}
            className="touch-target shrink-0 text-brand-muted transition-colors hover:text-white"
            aria-label="Dismiss audience alert"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
