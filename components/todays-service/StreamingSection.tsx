"use client";

import dynamic from "next/dynamic";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import GuidedEmptyState from "@/components/todays-service/GuidedEmptyState";
import StreamingDestinationList from "@/components/streaming/StreamingDestinationList";
import StreamingSetupWarningSlot from "@/components/streaming/StreamingSetupWarningSlot";
import { ServiceCard, TS } from "@/components/todays-service/ServiceUi";
import {
  STREAMING_ACCOUNTS_LABEL,
  STREAMING_SECTION_MIN_HEIGHT,
  STREAMING_SECTION_TITLE,
} from "@/lib/streaming/streaming-layout";
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

function StreamingOAuthResume({
  onResume,
  onError,
}: {
  onResume: (destinationId: string, step: StreamingWizardStep) => void;
  onError: () => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const streaming = searchParams.get("streaming");
    const destinationId = searchParams.get("destinationId");
    const wizardStep = searchParams.get("wizardStep") as StreamingWizardStep | null;
    if (streaming === "connected" && destinationId) {
      onResume(destinationId, wizardStep ?? "stream-info");
      window.history.replaceState({}, "", "/dashboard/todays-service");
    } else if (streaming === "error") {
      onError();
      window.history.replaceState({}, "", "/dashboard/todays-service");
    }
  }, [onError, onResume, searchParams]);

  return null;
}

function StreamingSection({
  destinations,
  broadcastDestinationCards,
  soundItems,
  onReload,
  onToast,
}: StreamingSectionProps) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [resumeDestinationId, setResumeDestinationId] = useState<string | null>(null);
  const [resumeStep, setResumeStep] = useState<StreamingWizardStep | null>(null);
  const [settingsDest, setSettingsDest] = useState<StreamingDestination | null>(null);

  const hasReadySelected = useMemo(
    () => destinations.some((d) => d.selectedForToday && d.connectionStatus === "ready"),
    [destinations],
  );

  const openWizard = useCallback(() => {
    setResumeDestinationId(null);
    setResumeStep(null);
    setWizardOpen(true);
  }, []);

  const handleOAuthResume = useCallback((destinationId: string, step: StreamingWizardStep) => {
    setResumeDestinationId(destinationId);
    setResumeStep(step);
    setWizardOpen(true);
    onToast("success", "Streaming account connected.");
  }, [onToast]);

  const handleOAuthError = useCallback(() => {
    onToast("error", "Streaming account connection failed. Try again.");
  }, [onToast]);

  const handleEditSetup = useCallback((destinationId: string) => {
    setResumeDestinationId(destinationId);
    setResumeStep("stream-info");
    setWizardOpen(true);
  }, []);

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

  useEffect(() => {
    if (!wizardOpen) return;
    const timer = window.setTimeout(() => {
      setResumeDestinationId(null);
      setResumeStep(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [wizardOpen]);

  return (
    <ServiceCard
      title={STREAMING_SECTION_TITLE}
      className={STREAMING_SECTION_MIN_HEIGHT}
      action={
        <button type="button" onClick={openWizard} className={TS.addBtn}>
          + Add Destination
        </button>
      }
    >
      <StreamingOAuthResume onResume={handleOAuthResume} onError={handleOAuthError} />

      <p className="font-ui text-[0.5rem] uppercase tracking-[0.12em] text-white/45">
        {STREAMING_ACCOUNTS_LABEL}
      </p>

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
          <StreamingSetupWarningSlot visible={!hasReadySelected} />
          <StreamingDestinationList
            destinations={destinations}
            onReload={onReload}
            onToast={onToast}
            onSettings={setSettingsDest}
            onEditSetup={handleEditSetup}
          />
        </>
      )}

      <StreamingSetupWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSaved={onReload}
        onToast={onToast}
        destinations={destinations}
        broadcastDestinationCards={broadcastDestinationCards}
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

export default memo(StreamingSection);
