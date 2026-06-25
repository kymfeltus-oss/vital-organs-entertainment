"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { buildBroadcastDestinationCards } from "@/lib/streaming/broadcast-catalog";
import DestinationCard from "@/components/streaming/DestinationCard";
import GuidedEmptyState from "@/components/todays-service/GuidedEmptyState";
import { ServiceCard, TS } from "@/components/todays-service/ServiceUi";
import type { StreamingWizardStep } from "@/lib/streaming/setup";
import type { SoundItem, StreamingDestination } from "@/lib/todays-service/types";

const StreamingSetupWizard = dynamic(() => import("@/components/streaming/StreamingSetupWizard"), {
  ssr: false,
});
const DestinationSettingsModal = dynamic(() => import("@/components/streaming/DestinationSettingsModal"), {
  ssr: false,
});

type StreamingSectionProps = {
  destinations: StreamingDestination[];
  broadcastDestinationCards?: import("@/lib/todays-service/types").BroadcastDestinationCard[];
  soundItems: SoundItem[];
  onReload: () => Promise<unknown>;
  onToast: (type: "success" | "error", message: string) => void;
};

type OpenWizardEventDetail = {
  destinationId?: string | null;
  step?: StreamingWizardStep | null;
};

// #region agent log
function agentLog(location: string, message: string, data: Record<string, unknown>): void {
  fetch("http://127.0.0.1:7242/ingest/90113a7b-b2ce-449d-9c16-dbf632e3c139", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
    body: JSON.stringify({
      sessionId: "675ed0",
      runId: "streaming-fix",
      hypothesisId: "H1-cards-undefined",
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => undefined);
}
// #endregion

export default function StreamingSection({
  destinations,
  broadcastDestinationCards,
  soundItems,
  onReload,
  onToast,
}: StreamingSectionProps) {
  const searchParams = useSearchParams();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [resumeDestinationId, setResumeDestinationId] = useState<string | null>(null);
  const [resumeStep, setResumeStep] = useState<StreamingWizardStep | null>(null);
  const [settingsDest, setSettingsDest] = useState<StreamingDestination | null>(null);

  const destinationCards = useMemo(() => {
    if (Array.isArray(broadcastDestinationCards) && broadcastDestinationCards.length > 0) {
      return broadcastDestinationCards;
    }
    return buildBroadcastDestinationCards({ destinations, selections: [] });
  }, [broadcastDestinationCards, destinations]);

  useEffect(() => {
    // #region agent log
    agentLog("StreamingSection.tsx:mount", "streaming section cards resolved", {
      rawCardsType: broadcastDestinationCards == null ? "nullish" : "array",
      rawCardsLength: broadcastDestinationCards?.length ?? 0,
      resolvedCardsLength: destinationCards.length,
      destinationsLength: destinations.length,
    });
    // #endregion
  }, [broadcastDestinationCards, destinationCards.length, destinations.length]);

  const openWizard = useCallback(() => {
    setResumeDestinationId(null);
    setResumeStep(null);
    setWizardOpen(true);
  }, []);

  useEffect(() => {
    const streaming = searchParams.get("streaming");
    const destinationId = searchParams.get("destinationId");
    const wizardStep = searchParams.get("wizardStep") as StreamingWizardStep | null;
    if (streaming === "connected" && destinationId) {
      setResumeDestinationId(destinationId);
      setResumeStep(wizardStep ?? "stream-info");
      setWizardOpen(true);
      onToast("success", "Streaming account connected.");
      window.history.replaceState({}, "", "/dashboard/todays-service");
    } else if (streaming === "error") {
      onToast("error", "Streaming account connection failed. Try again.");
      window.history.replaceState({}, "", "/dashboard/todays-service");
    }
  }, [searchParams, onToast]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<OpenWizardEventDetail>).detail;
      setResumeDestinationId(detail?.destinationId ?? null);
      setResumeStep(detail?.step ?? "authenticate");
      setWizardOpen(true);
    };
    window.addEventListener("streaming:open-wizard", handler as EventListener);
    return () => window.removeEventListener("streaming:open-wizard", handler as EventListener);
  }, []);

  const hasReadySelected = destinations.some((d) => d.selectedForToday && d.connectionStatus === "ready");

  return (
    <ServiceCard
      title="Where You're Streaming"
      action={
        <button type="button" onClick={openWizard} className={TS.addBtn}>
          + Add Destination
        </button>
      }
    >
      <p className="mb-3 font-ui text-[0.5rem] uppercase tracking-[0.12em] text-white/45">Streaming Accounts</p>

      {destinations.length === 0 ? (
        <GuidedEmptyState
          title="Let's connect where you want to stream."
          intro="Popular options:"
          bullets={["YouTube", "Facebook", "Church Website"]}
          actionLabel="Connect Streaming"
          onAction={openWizard}
        />
      ) : (
        <>
          {!hasReadySelected ? (
            <p className="mb-3 font-body text-sm text-amber-200/90">
              Choose at least one streaming destination and complete setup before going live.
            </p>
          ) : null}
          <div className="grid gap-2 md:grid-cols-2">
            {destinations.map((dest) => (
              <DestinationCard
                key={dest.id}
                destination={dest}
                onReload={onReload}
                onToast={onToast}
                onSettings={setSettingsDest}
                onEditSetup={() => {
                  setResumeDestinationId(dest.id);
                  setResumeStep("stream-info");
                  setWizardOpen(true);
                }}
              />
            ))}
          </div>
        </>
      )}

      <StreamingSetupWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSaved={onReload}
        onToast={onToast}
        destinations={destinations}
        broadcastDestinationCards={destinationCards}
        soundItems={soundItems}
        resumeDestinationId={resumeDestinationId}
        resumeStep={resumeStep}
      />

      <DestinationSettingsModal
        open={Boolean(settingsDest)}
        destination={settingsDest}
        onClose={() => setSettingsDest(null)}
        onSaved={onReload}
        onToast={onToast}
      />
    </ServiceCard>
  );
}
