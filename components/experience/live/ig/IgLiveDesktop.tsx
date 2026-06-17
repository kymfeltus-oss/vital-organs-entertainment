"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import IgLiveActionPanels from "@/components/experience/live/ig/IgLiveActionPanels";
import IgLiveActionRail from "@/components/experience/live/ig/IgLiveActionRail";
import IgLiveSheet from "@/components/experience/live/ig/IgLiveSheet";
import IgLiveVideoStage from "@/components/experience/live/ig/IgLiveVideoStage";
import FeatureErrorBoundary from "@/components/parable/FeatureErrorBoundary";
import { useLiveExperienceStream } from "@/lib/experience/LiveExperienceStreamContext";
import type { IgLiveSheetAction } from "@/lib/experience/ig-live-config";
import { useIgLiveViewerCount } from "@/lib/experience/useIgLiveViewerCount";
import { IG_LIVE_CREATOR } from "@/lib/experience/ig-live-config";
import Link from "next/link";
import { X } from "lucide-react";

import IgLivePreviewSidebar from "@/components/experience/live/ig/IgLivePreviewSidebar";

const FellowshipChatPanel = dynamic(
  () => import("@/components/experience/live/FellowshipChatPanel"),
  {
    ssr: false,
    loading: () => (
      <p className="px-2 py-4 font-body text-sm text-brand-muted">Opening Fellowship Chat…</p>
    ),
  },
);

const ExperienceSelector = dynamic(
  () => import("@/components/experience/live/ExperienceSelector"),
  { ssr: false },
);

type IgLiveDesktopProps = {
  showPaywall: boolean;
  paywallOverlay?: ReactNode;
  preview?: boolean;
};

export default function IgLiveDesktop({
  showPaywall,
  paywallOverlay,
  preview = false,
}: IgLiveDesktopProps) {
  const [sheetAction, setSheetAction] = useState<IgLiveSheetAction>(null);
  const viewerLabel = useIgLiveViewerCount(!preview);
  const { feeds, showSelector, selectedExperience, setSelectedExperience, fallbackNotice } =
    useLiveExperienceStream();

  const panelAction =
    sheetAction && sheetAction !== "more" ? sheetAction : null;

  return (
    <div className="ig-live-root ig-live-root--desktop">
      <section className="relative min-h-0 overflow-hidden">
        <IgLiveVideoStage
          showPaywall={showPaywall}
          paywallOverlay={paywallOverlay}
          preview={preview}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-4">
          <div>
            <p className="font-headline text-fluid-section uppercase tracking-widest text-white ig-live-text-shadow">
              {IG_LIVE_CREATOR.subtitle}
            </p>
            <p className="mt-1 font-ui text-xs font-semibold uppercase tracking-[0.14em] text-brand-pink">
              ● Live · {viewerLabel} watching
            </p>
          </div>
          <Link
            href={IG_LIVE_CREATOR.exitHref}
            className="touch-target pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-brand-border bg-black/40 text-white backdrop-blur-md transition hover:bg-black/55"
            aria-label="Exit live"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>

        {showSelector && !preview ? (
          <div className="absolute left-6 top-24 z-20 max-w-md">
            <ExperienceSelector
              feeds={feeds}
              selectedKey={selectedExperience}
              onSelect={setSelectedExperience}
            />
          </div>
        ) : null}

        <IgLiveActionRail
          onFocusComment={() => {
            const input = document.getElementById("fellowship-chat-input");
            input?.focus();
          }}
          onOpenGive={() => setSheetAction("give")}
          onOpenMore={() => setSheetAction("more")}
        />

        {fallbackNotice ? (
          <p
            className="absolute bottom-4 left-6 z-20 max-w-md font-body text-xs text-brand-muted ig-live-text-shadow"
            role="status"
          >
            {fallbackNotice}
          </p>
        ) : null}
      </section>

      {preview ? (
        <IgLivePreviewSidebar />
      ) : (
        <aside className="ig-live-glass-sidebar flex min-h-0 min-w-0 flex-col border-l border-brand-border">
          <div className="shrink-0 border-b border-brand-border px-4 py-3">
            <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.18em] text-brand-muted">
              Fellowship Chat
            </p>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-3">
            <FeatureErrorBoundary featureLabel="Fellowship Chat">
              <FellowshipChatPanel embedded />
            </FeatureErrorBoundary>
          </div>
        </aside>
      )}

      <IgLiveSheet
        action={sheetAction}
        onClose={() => setSheetAction(null)}
        onSelectAction={(action) => setSheetAction(action)}
      >
        {panelAction ? <IgLiveActionPanels action={panelAction} /> : null}
      </IgLiveSheet>
    </div>
  );
}
