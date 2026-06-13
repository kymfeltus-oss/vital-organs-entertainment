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
  const [prayer, give, program] = EXPERIENCE_ACTIONS;

  return (
    <nav
      className="experience-glass-panel fixed inset-x-0 bottom-0 z-30 border-t border-brand-border/80 md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      aria-label="Live experience actions"
    >
      <div className="grid grid-cols-3 items-end gap-1 px-2 pt-2">
        {[prayer, give, program].map(({ id, label, icon: Icon }) => {
          const active = activeAction === id;
          const isGive = id === "give";

          return (
            <button
              key={id}
              type="button"
              onClick={() => onAction(id)}
              className={`touch-target flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 font-ui transition ${
                isGive ? "experience-dock-give min-h-12 py-2.5" : "min-h-11"
              } ${
                active
                  ? "bg-brand-blue/15 text-brand-blue"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              } ${active && isGive ? "text-brand-blue" : ""}`}
            >
              <Icon
                className={`shrink-0 ${isGive ? "h-5 w-5" : "h-4 w-4"}`}
                aria-hidden="true"
              />
              <span
                className={`leading-tight uppercase tracking-[0.1em] ${
                  isGive ? "text-[0.55rem] font-bold" : "text-[0.5rem] font-bold"
                } ${active ? "" : isGive ? "" : "sr-only sm:not-sr-only"}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
