"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import ExperienceActionSheet from "@/components/experience/live/ExperienceActionSheet";
import ExperienceBottomBar from "@/components/experience/live/ExperienceBottomBar";
import ExperienceBrandHeader from "@/components/experience/live/ExperienceBrandHeader";
import {
  EXPERIENCE_ACTIONS,
  type ExperienceActionId,
} from "@/components/experience/live/experience-actions";

const FellowshipChatPanel = dynamic(
  () => import("@/components/experience/live/FellowshipChatPanel"),
  {
    ssr: false,
    loading: () => (
      <p className="px-2 py-4 font-body text-sm text-brand-muted">Opening Fellowship Chat…</p>
    ),
  },
);

const ExperiencePrayerPanel = dynamic(
  () => import("@/components/experience/live/ExperiencePrayerPanel"),
  { ssr: false },
);

const ExperienceGivingPanel = dynamic(
  () => import("@/components/experience/live/ExperienceGivingPanel"),
  { ssr: false },
);

const EventProgramPanel = dynamic(
  () => import("@/components/experience/live/EventProgramPanel"),
  { ssr: false },
);

type ExperienceLiveLayoutProps = {
  variant: "waiting" | "live";
  stage: ReactNode;
  openAction: ExperienceActionId;
  onOpenAction: (action: Exclude<ExperienceActionId, null>) => void;
  onCloseAction: () => void;
};

function ActionPanelContent({ action }: { action: Exclude<ExperienceActionId, null> }) {
  if (action === "prayer") return <ExperiencePrayerPanel />;
  if (action === "give") return <ExperienceGivingPanel />;
  return <EventProgramPanel />;
}

export default function ExperienceLiveLayout({
  variant,
  stage,
  openAction,
  onOpenAction,
  onCloseAction,
}: ExperienceLiveLayoutProps) {
  const toggleAction = (action: Exclude<ExperienceActionId, null>) => {
    if (openAction === action) {
      onCloseAction();
      return;
    }
    onOpenAction(action);
  };

  return (
    <div className="flex min-h-dvh w-full flex-col overflow-x-hidden bg-brand-black text-white md:h-dvh md:overflow-hidden">
      <header className="shrink-0 border-b border-brand-border px-4 py-3 pt-safe md:px-6">
        <ExperienceBrandHeader compact liveBadge={variant === "live"} />
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[minmax(0,1fr)_min(22rem,28vw)] md:overflow-hidden">
        <section className="shrink-0 md:flex md:min-h-0 md:flex-col md:overflow-hidden md:p-4 md:pr-2">
          <div className="w-full md:min-h-0 md:flex-1">{stage}</div>
        </section>

        <aside className="flex min-h-0 flex-1 flex-col border-t border-brand-border md:h-full md:border-t-0 md:border-l">
          <div className="hidden shrink-0 gap-2 border-b border-brand-border p-3 md:flex">
            {EXPERIENCE_ACTIONS.map(({ id, label, icon: Icon }) => {
              const active = openAction === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleAction(id)}
                  className={`touch-target flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em] transition ${
                    active
                      ? "border-brand-blue/50 bg-brand-blue/10 text-brand-blue"
                      : "border-brand-border bg-black/40 text-brand-muted hover:border-white/15 hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-3 pt-3 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-3">
            <FellowshipChatPanel embedded />
          </div>
        </aside>
      </div>

      <ExperienceBottomBar activeAction={openAction} onAction={toggleAction} />

      <ExperienceActionSheet action={openAction} onClose={onCloseAction}>
        {openAction ? <ActionPanelContent action={openAction} /> : null}
      </ExperienceActionSheet>
    </div>
  );
}
