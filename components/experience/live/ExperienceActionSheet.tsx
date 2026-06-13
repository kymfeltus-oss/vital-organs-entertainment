"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import type { ExperienceActionId } from "@/components/experience/live/experience-actions";

const ACTION_TITLES: Record<Exclude<ExperienceActionId, null>, string> = {
  prayer: "Prayer",
  give: "Give",
  program: "Event Program",
};

type ExperienceActionSheetProps = {
  action: ExperienceActionId;
  onClose: () => void;
  children: ReactNode;
};

export default function ExperienceActionSheet({
  action,
  onClose,
  children,
}: ExperienceActionSheetProps) {
  useEffect(() => {
    if (!action) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [action, onClose]);

  if (!action) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-stretch md:justify-end">
      <button
        type="button"
        aria-label="Close panel"
        className="experience-action-backdrop absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="experience-action-title"
        className="experience-action-sheet experience-drawer-sheet relative flex max-h-[min(88dvh,720px)] w-full flex-col rounded-t-2xl md:my-4 md:mr-4 md:max-h-[calc(100dvh-2rem)] md:w-[min(28rem,92vw)] md:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-brand-border px-4 py-3">
          <h2
            id="experience-action-title"
            className="font-ui text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white"
          >
            {ACTION_TITLES[action]}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="touch-target rounded-lg border border-brand-border p-2 text-brand-muted transition hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-safe">{children}</div>
      </div>
    </div>
  );
}
