"use client";

import { AlertTriangle, EyeOff, VolumeX, X } from "lucide-react";
import type { ChatTroubleCategory } from "@/lib/ops/chat-scanner";

type TroubleAlertPopupProps = {
  issueType: ChatTroubleCategory | null;
  count: number;
  onClear: () => void;
};

export default function TroubleAlertPopup({
  issueType,
  count,
  onClear,
}: TroubleAlertPopupProps) {
  if (!issueType || count <= 0) return null;

  const attendeeLabel = count === 1 ? "1 viewer" : `${count} viewers`;

  return (
    <div
      className="pointer-events-auto fixed bottom-4 right-4 z-[60] w-[min(100vw-2rem,22rem)] rounded-xl border border-amber-500/70 bg-brand-panel p-4 text-white shadow-2xl shadow-amber-500/10 motion-safe:animate-[trouble-alert-enter_0.45s_ease-out]"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400">
          {issueType === "audio" ? (
            <VolumeX className="h-5 w-5" aria-hidden="true" />
          ) : (
            <EyeOff className="h-5 w-5" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1 text-sm">
          <h4 className="flex items-center gap-1.5 font-ui text-[0.62rem] font-bold uppercase tracking-[0.16em] text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Crew Alert</span>
          </h4>
          <p className="mt-1 font-body text-sm font-medium leading-snug text-zinc-200">
            {issueType === "audio"
              ? `${attendeeLabel} reported they CANNOT HEAR the broadcast in chat.`
              : `${attendeeLabel} reported they CANNOT SEE the video stream in chat.`}
          </p>
          <p className="mt-2 font-body text-[0.68rem] italic leading-snug text-brand-muted">
            Fix check: verify mixer faders, Restream ingest, and vMix encoder output.
          </p>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="touch-target shrink-0 text-brand-muted transition-colors hover:text-white"
          aria-label="Dismiss crew alert"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
