"use client";

import dynamic from "next/dynamic";
import { MessageSquare, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import ExperienceActionSheet from "@/components/experience/live/ExperienceActionSheet";
import ExperienceBottomBar from "@/components/experience/live/ExperienceBottomBar";
import ExperienceBrandHeader from "@/components/experience/live/ExperienceBrandHeader";
import {
  EXPERIENCE_ACTIONS,
  type ExperienceActionId,
} from "@/components/experience/live/experience-actions";
import { useMobileLandscape } from "@/lib/experience/useMobileLandscape";

const FellowshipChatPanel = dynamic(
  () => import("@/components/experience/live/FellowshipChatPanel"),
  {
    ssr: false,
    loading: () => (
      <p className="px-2 py-4 font-body text-sm text-zinc-400">Opening Fellowship Chat…</p>
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
  const isMobileLandscape = useMobileLandscape();
  const [chatOverlayOpen, setChatOverlayOpen] = useState(false);

  useEffect(() => {
    if (!isMobileLandscape) setChatOverlayOpen(false);
  }, [isMobileLandscape]);

  const toggleAction = (action: Exclude<ExperienceActionId, null>) => {
    if (openAction === action) {
      onCloseAction();
      return;
    }
    onOpenAction(action);
  };

  const showInlineChat = !isMobileLandscape;

  return (
    <div className="experience-live-root flex min-h-dvh w-full max-w-[100vw] flex-col overflow-x-hidden md:h-dvh md:overflow-hidden">
      <header className="relative z-20 shrink-0 border-b border-white/8 px-3 py-2 pt-safe md:px-6 md:py-3">
        <ExperienceBrandHeader compact liveBadge={variant === "live"} />
      </header>

      <div
        className={`relative flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[minmax(0,1.9fr)_minmax(20rem,1fr)] md:overflow-hidden ${
          isMobileLandscape ? "overflow-hidden" : ""
        }`}
      >
        <section
          className={`relative w-full min-w-0 shrink-0 md:flex md:min-h-0 md:flex-col md:overflow-hidden md:p-4 md:pr-3 ${
            isMobileLandscape ? "min-h-0 flex-1" : ""
          }`}
        >
          <div
            className={`experience-live-stage-mobile w-full min-w-0 ${
              isMobileLandscape ? "h-full" : "md:min-h-0 md:flex-1"
            }`}
          >
            {stage}
          </div>

          {isMobileLandscape ? (
            <button
              type="button"
              onClick={() => setChatOverlayOpen((open) => !open)}
              aria-expanded={chatOverlayOpen}
              aria-controls="experience-chat-overlay"
              className={`touch-target fixed right-3 z-30 flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 font-ui text-[0.55rem] font-bold uppercase tracking-[0.12em] shadow-lg backdrop-blur-md transition ${
                chatOverlayOpen
                  ? "border-[#B0267A]/50 bg-[#B0267A]/15 text-[#B0267A]"
                  : "border-[#1E40AF]/50 bg-[#111111]/90 exp-text-blue"
              }`}
              style={{ top: "calc(3.25rem + env(safe-area-inset-top))" }}
            >
              {chatOverlayOpen ? (
                <X className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              Chat
            </button>
          ) : null}
        </section>

        {showInlineChat ? (
          <aside className="experience-chat-column flex min-h-[50dvh] min-w-0 flex-[1.2] flex-col md:h-full md:min-h-0 md:flex-1">
            <div className="hidden shrink-0 gap-2 border-b border-white/8 p-3 md:flex">
              {EXPERIENCE_ACTIONS.map(({ id, label, icon: Icon }) => {
                const active = openAction === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleAction(id)}
                    className={`touch-target flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em] transition ${
                      active
                        ? "experience-dock-active border-[#1E40AF]/50"
                        : "border-white/8 bg-[#111111]/80 text-zinc-400 hover:border-[#1E40AF]/35 hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col px-2.5 pt-2.5 pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:px-3 md:pt-3 md:pb-3">
              <FellowshipChatPanel embedded />
            </div>
          </aside>
        ) : null}

        {isMobileLandscape && chatOverlayOpen ? (
          <aside
            id="experience-chat-overlay"
            className="experience-glass-panel fixed inset-x-0 bottom-0 z-40 flex max-h-[min(72dvh,100%)] min-w-0 flex-col"
            style={{
              top: "calc(3.25rem + env(safe-area-inset-top))",
              paddingBottom: "calc(4.75rem + env(safe-area-inset-bottom, 0px))",
            }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-3 py-2">
              <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-zinc-400">
                Fellowship Chat
              </p>
              <button
                type="button"
                onClick={() => setChatOverlayOpen(false)}
                className="touch-target rounded-lg border border-white/8 p-2 text-zinc-400 hover:text-white"
                aria-label="Close chat overlay"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col px-2.5 py-2">
              <FellowshipChatPanel embedded />
            </div>
          </aside>
        ) : null}
      </div>

      <ExperienceBottomBar activeAction={openAction} onAction={toggleAction} />

      <ExperienceActionSheet action={openAction} onClose={onCloseAction}>
        {openAction ? <ActionPanelContent action={openAction} /> : null}
      </ExperienceActionSheet>
    </div>
  );
}
