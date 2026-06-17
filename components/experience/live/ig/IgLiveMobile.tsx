"use client";

import dynamic from "next/dynamic";
import { useRef, useState, type ReactNode } from "react";
import IgLiveActionPanels from "@/components/experience/live/ig/IgLiveActionPanels";
import IgLiveActionRail from "@/components/experience/live/ig/IgLiveActionRail";
import IgLiveComposer, { type IgLiveComposerHandle } from "@/components/experience/live/ig/IgLiveComposer";
import IgLiveFloatingChat from "@/components/experience/live/ig/IgLiveFloatingChat";
import IgLiveSheet from "@/components/experience/live/ig/IgLiveSheet";
import IgLiveTopBar from "@/components/experience/live/ig/IgLiveTopBar";
import IgLiveVideoStage from "@/components/experience/live/ig/IgLiveVideoStage";
import { useLiveExperienceStream } from "@/lib/experience/LiveExperienceStreamContext";
import type { IgLiveSheetAction } from "@/lib/experience/ig-live-config";

const ExperienceSelector = dynamic(
  () => import("@/components/experience/live/ExperienceSelector"),
  { ssr: false },
);

type IgLiveMobileProps = {
  showPaywall: boolean;
  paywallOverlay?: ReactNode;
  preview?: boolean;
};

export default function IgLiveMobile({
  showPaywall,
  paywallOverlay,
  preview = false,
}: IgLiveMobileProps) {
  const composerRef = useRef<IgLiveComposerHandle>(null);
  const [sheetAction, setSheetAction] = useState<IgLiveSheetAction>(null);
  const { feeds, showSelector, selectedExperience, setSelectedExperience } =
    useLiveExperienceStream();

  const openSheet = (action: IgLiveSheetAction) => setSheetAction(action);
  const closeSheet = () => setSheetAction(null);

  const panelAction =
    sheetAction && sheetAction !== "more" ? sheetAction : null;

  return (
    <div className="ig-live-root relative h-dvh w-full overflow-hidden bg-black md:hidden">
      <IgLiveVideoStage
        showPaywall={showPaywall}
        paywallOverlay={paywallOverlay}
        preview={preview}
      />

      <IgLiveTopBar preview={preview} />
      <IgLiveFloatingChat preview={preview} />

      {showSelector && !preview ? (
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
        preview={preview}
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
