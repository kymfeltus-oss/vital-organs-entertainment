"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import IgLiveActionPanels from "@/components/experience/live/ig/IgLiveActionPanels";
import IgLiveActionRail from "@/components/experience/live/ig/IgLiveActionRail";
import IgLiveComposer, { type IgLiveComposerHandle } from "@/components/experience/live/ig/IgLiveComposer";
import IgLiveFloatingChat from "@/components/experience/live/ig/IgLiveFloatingChat";
import type { IgLiveSurfaceProps } from "@/components/experience/live/ig/ig-live-shell-types";
import IgLiveSheet from "@/components/experience/live/ig/IgLiveSheet";
import IgLiveTopBar from "@/components/experience/live/ig/IgLiveTopBar";
import IgLiveVideoStage from "@/components/experience/live/ig/IgLiveVideoStage";
import { useLiveExperienceStream } from "@/lib/experience/LiveExperienceStreamContext";
import type { IgLiveSheetAction } from "@/lib/experience/ig-live-config";

const ExperienceSelector = dynamic(
  () => import("@/components/experience/live/ExperienceSelector"),
  { ssr: false },
);

export default function IgLiveMobile({
  mode,
  showPaywall,
  paywallOverlay,
  waiting,
}: IgLiveSurfaceProps) {
  const composerRef = useRef<IgLiveComposerHandle>(null);
  const [sheetAction, setSheetAction] = useState<IgLiveSheetAction>(null);
  const { feeds, showSelector, selectedExperience, setSelectedExperience } =
    useLiveExperienceStream();
  const isLive = mode === "live";

  const openSheet = (action: IgLiveSheetAction) => setSheetAction(action);
  const closeSheet = () => setSheetAction(null);

  const panelAction =
    sheetAction && sheetAction !== "more" ? sheetAction : null;

  return (
    <div className="ig-live-root">
      <IgLiveVideoStage
        mode={mode}
        showPaywall={showPaywall}
        paywallOverlay={paywallOverlay}
        waiting={waiting}
      />

      <IgLiveTopBar isLive={isLive} />
      <IgLiveFloatingChat />

      {showSelector && isLive ? (
        <div className="absolute left-4 right-20 top-[calc(4.75rem+env(safe-area-inset-top))] z-20">
          <ExperienceSelector
            feeds={feeds}
            selectedKey={selectedExperience}
            onSelect={setSelectedExperience}
          />
        </div>
      ) : null}

      <IgLiveActionRail
        onFocusComment={() => composerRef.current?.focus()}
        onOpenGive={() => openSheet("give")}
        onOpenMore={() => openSheet("more")}
      />

      <IgLiveComposer
        ref={composerRef}
        onOpenGive={() => openSheet("give")}
      />

      <IgLiveSheet
        action={sheetAction}
        onClose={closeSheet}
        onSelectAction={(action) => setSheetAction(action)}
      >
        {panelAction ? <IgLiveActionPanels action={panelAction} /> : null}
      </IgLiveSheet>
    </div>
  );
}
