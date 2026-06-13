"use client";

import {
  EXPERIENCE_ACTIONS,
  type ExperienceActionId,
} from "@/components/experience/live/experience-actions";

type ExperienceBottomBarProps = {
  activeAction: ExperienceActionId;
  onAction: (action: Exclude<ExperienceActionId, null>) => void;
};

export default function ExperienceBottomBar({
  activeAction,
  onAction,
}: ExperienceBottomBarProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-border bg-brand-black/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      aria-label="Live experience actions"
    >
      <div className="grid grid-cols-3 gap-1 px-2 pt-2">
        {EXPERIENCE_ACTIONS.map(({ id, label, icon: Icon }) => {
          const active = activeAction === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onAction(id)}
              className={`touch-target flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em] transition ${
                active
                  ? "bg-brand-blue/15 text-brand-blue"
                  : "text-brand-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="leading-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
