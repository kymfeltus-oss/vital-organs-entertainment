"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type OpsDrawerProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export default function OpsDrawer({ open, title, onClose, children }: OpsDrawerProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-stretch md:justify-end">
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="ops-drawer-title"
        className="relative flex max-h-[min(88dvh,720px)] w-full flex-col rounded-t-3xl border-t border-brand-border bg-brand-panel/95 backdrop-blur-xl md:my-4 md:mr-4 md:max-h-[calc(100dvh-2rem)] md:w-[min(32rem,92vw)] md:rounded-2xl md:border"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-brand-border px-4 py-3">
          <h2
            id="ops-drawer-title"
            className="font-ui text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="touch-target rounded-lg p-1.5 text-brand-muted transition hover:bg-brand-black hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </aside>
    </div>
  );
}
