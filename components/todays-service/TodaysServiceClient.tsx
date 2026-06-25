"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import SectionPlaceholder from "@/components/todays-service/SectionPlaceholder";
import ServiceHeaderActionsPortal from "@/components/todays-service/ServiceHeaderActionsPortal";
import TodaysServiceLiveStatus from "@/components/todays-service/TodaysServiceLiveStatus";
import { TS } from "@/components/todays-service/ServiceUi";
import { TODAYS_SERVICE_SHELL as SHELL } from "@/lib/todays-service/shell-styles";
import { useTodaysService } from "@/lib/todays-service/useTodaysService";
import {
  isSetupComplete,
  isSoundSetupComplete,
  isVolunteerSetupComplete,
  markWelcomeComplete,
  nextIncompleteSetupAction,
  shouldShowWelcomeBanner,
} from "@/lib/todays-service/coaching";
import type { ServiceHeaderUpdate } from "@/lib/todays-service/service-header";
import type { TodaysServicePayload } from "@/lib/todays-service/types";

const BroadcastProfileCard = dynamic(() => import("@/components/todays-service/BroadcastProfileCard"));
const SetupProgressBanner = dynamic(() => import("@/components/todays-service/SetupProgressBanner"));
const WelcomeBanner = dynamic(() => import("@/components/todays-service/WelcomeBanner"));
const StatusOverviewRow = dynamic(() => import("@/components/todays-service/StatusOverviewRow"));

const SoundSection = dynamic(() => import("@/components/todays-service/SoundSection"), {
  loading: () => <SectionPlaceholder minHeight="220px" />,
});
const CamerasSection = dynamic(() => import("@/components/todays-service/CamerasSection"), {
  loading: () => <SectionPlaceholder minHeight="220px" />,
});
const InternetSection = dynamic(() => import("@/components/todays-service/InternetSection"), {
  loading: () => <SectionPlaceholder minHeight="220px" />,
});
const StreamingSection = dynamic(() => import("@/components/todays-service/StreamingSection"), {
  loading: () => <SectionPlaceholder minHeight="220px" />,
});
const RecordingSection = dynamic(() => import("@/components/todays-service/RecordingSection"), {
  loading: () => <SectionPlaceholder minHeight="200px" />,
});
const PresentationSection = dynamic(() => import("@/components/todays-service/PresentationSection"), {
  loading: () => <SectionPlaceholder minHeight="200px" />,
});
const ServiceTimeline = dynamic(() => import("@/components/todays-service/ServiceTimeline"), {
  loading: () => <SectionPlaceholder minHeight="200px" />,
});
const TeamSection = dynamic(() => import("@/components/todays-service/TeamSection"), {
  loading: () => <SectionPlaceholder minHeight="200px" />,
});
const AttentionSection = dynamic(() => import("@/components/todays-service/AttentionSection"), {
  loading: () => <SectionPlaceholder minHeight="200px" />,
});
const QuickActions = dynamic(() => import("@/components/todays-service/QuickActions"), {
  ssr: false,
});
const SoundSetupWizard = dynamic(() => import("@/components/todays-service/SoundSetupWizard"), {
  ssr: false,
});
const EditServiceModal = dynamic(() => import("@/components/todays-service/EditServiceModal"), {
  ssr: false,
});
const ChangeProfileModal = dynamic(() => import("@/components/todays-service/ChangeProfileModal"), {
  ssr: false,
});
const DeleteConfirmDialog = dynamic(() => import("@/components/todays-service/DeleteConfirmDialog"), {
  ssr: false,
});

type TodaysServiceClientProps = {
  operatorEmail: string;
  initialData: TodaysServicePayload;
  /** Server renders the LCP title; actions portal into the header slot. */
  headerLayout?: "actions-only";
};

export default function TodaysServiceClient({
  operatorEmail: _operatorEmail,
  initialData,
  headerLayout = "actions-only",
}: TodaysServiceClientProps) {
  const {
    data,
    loading,
    error,
    connection,
    toast,
    reload,
    saveHeader,
    saveBroadcastProfile,
    refreshCheck,
    beginService,
    stopService,
    showToast,
  } = useTodaysService({ initialData });

  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);
  const [isChangeProfileOpen, setIsChangeProfileOpen] = useState(false);
  const [headerSaveError, setHeaderSaveError] = useState<string | null>(null);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [beginConfirm, setBeginConfirm] = useState<{
    issues: string[];
    streamingGate?: import("@/lib/streaming/types").StreamingGoLiveResult;
  } | null>(null);
  const [beginning, setBeginning] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => shouldShowWelcomeBanner(initialData));
  const [soundSetupTrigger, setSoundSetupTrigger] = useState(0);
  const [cameraSetupTrigger, setCameraSetupTrigger] = useState(0);

  useEffect(() => {
    if (data && isSetupComplete(data)) {
      markWelcomeComplete();
      setShowWelcome(false);
    }
  }, [data]);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleBeginService = useCallback(async () => {
    setBeginning(true);
    try {
      const result = await beginService(false);
      if (!result?.success) {
        if (result?.streamingGate?.needsAttention.length) {
          setBeginConfirm({ issues: result.criticalIssues, streamingGate: result.streamingGate });
          return;
        }
        if (result?.criticalIssues.length) {
          setBeginConfirm({ issues: result.criticalIssues });
        }
      }
    } finally {
      setBeginning(false);
    }
  }, [beginService]);

  const confirmBegin = useCallback(async (skipDestinationIds: string[] = []) => {
    setBeginning(true);
    setBeginConfirm(null);
    try {
      await beginService(true, skipDestinationIds);
    } finally {
      setBeginning(false);
    }
  }, [beginService]);

  const handleStopService = useCallback(async () => {
    try {
      await stopService();
    } catch {
      /* toast handled in hook */
    }
  }, [stopService]);

  const retryStreamingBegin = useCallback(async () => {
    if (!beginConfirm?.streamingGate) return;
    setBeginning(true);
    try {
      for (const dest of beginConfirm.streamingGate.needsAttention) {
        await import("@/lib/streaming/api").then((m) => m.testStreamingDestinationApi(dest.id));
      }
      await reload();
      const result = await beginService(false);
      if (!result.success && result.streamingGate?.needsAttention.length) {
        setBeginConfirm({ issues: result.criticalIssues, streamingGate: result.streamingGate });
      } else {
        setBeginConfirm(null);
      }
    } finally {
      setBeginning(false);
    }
  }, [beginConfirm, beginService, reload]);

  const continueSetup = useCallback(() => {
    if (!data) return;
    const action = nextIncompleteSetupAction(data);
    if (!action) return;

    if (action.openSoundWizard) {
      scrollTo("sound");
      setSoundSetupTrigger((value) => value + 1);
      return;
    }

    if (action.openCameraSetup) {
      scrollTo("cameras");
      setCameraSetupTrigger((value) => value + 1);
      return;
    }

    scrollTo(action.sectionId);
  }, [data, scrollTo]);

  const openEditServiceModal = useCallback(() => {
    setIsChangeProfileOpen(false);
    setHeaderSaveError(null);
    setIsEditServiceOpen(true);
  }, []);

  const openChangeProfileModal = useCallback(() => {
    setIsEditServiceOpen(false);
    setProfileSaveError(null);
    setIsChangeProfileOpen(true);
  }, []);

  const handleSaveHeader = useCallback(
    async (patch: ServiceHeaderUpdate) => {
      setSavingHeader(true);
      setHeaderSaveError(null);
      try {
        const result = await saveHeader(patch);
        if (!result.success && result.error) {
          setHeaderSaveError(result.error);
        }
        return result;
      } finally {
        setSavingHeader(false);
      }
    },
    [saveHeader],
  );

  const handleSaveProfile = useCallback(
    async (broadcastProfile: string) => {
      if (!data) return { success: false, error: "Service not loaded." };
      setSavingProfile(true);
      setProfileSaveError(null);
      try {
        const result = await saveBroadcastProfile(data.service.id, broadcastProfile);
        if (!result.success && result.error) {
          setProfileSaveError(result.error);
        }
        return result;
      } finally {
        setSavingProfile(false);
      }
    },
    [data, saveBroadcastProfile],
  );

  const setupComplete = useMemo(() => (data ? isVolunteerSetupComplete(data) : false), [data]);
  const soundComplete = useMemo(() => (data ? isSoundSetupComplete(data) : false), [data]);
  const cameraReadyCount = useMemo(
    () => (data ? data.cameras.filter((camera) => camera.status === "ready").length : 0),
    [data],
  );

  const handleRefreshCheck = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshCheck();
    } finally {
      setRefreshing(false);
    }
  }, [refreshCheck]);

  if (loading && !data) {
    return null;
  }

  if (error && !data) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${SHELL.content}`}>
        <p className="text-red-400" role="alert">
          {error}
        </p>
        <button type="button" onClick={() => void reload()} className={TS.btnPrimary}>
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      {headerLayout === "actions-only" ? (
        <ServiceHeaderActionsPortal
          service={data.service}
          setupComplete={setupComplete}
          onEdit={openEditServiceModal}
          onContinueSetup={continueSetup}
          onBeginService={() => void handleBeginService()}
          onStopService={() => void handleStopService()}
        />
      ) : null}

      <TodaysServiceLiveStatus connection={connection} />

      {showWelcome ? (
          <WelcomeBanner
            onStartGuidedSetup={() => {
              setShowWelcome(false);
              continueSetup();
            }}
          />
        ) : null}

        <SetupProgressBanner data={data} onContinueSetup={continueSetup} />

        <BroadcastProfileCard
          profileName={data.service.broadcastProfile}
          onChangeProfile={openChangeProfileModal}
        />

        <StatusOverviewRow
          data={data}
          setupComplete={setupComplete}
          cameraCount={data.cameras.length}
          cameraReadyCount={cameraReadyCount}
          destinationCount={data.streamingDestinations.length}
          recording={data.recordingSettings[0]}
          presentation={data.presentationSources[0]}
          onViewChecklist={() => scrollTo("alerts")}
          onRefresh={handleRefreshCheck}
          onFixIssues={continueSetup}
          onContinueSetup={continueSetup}
          onViewSection={scrollTo}
          refreshing={refreshing}
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-4">
          <div id="sound" className="scroll-mt-4">
            <SoundSection
              items={data.soundItems}
              mixers={data.mixers}
              soundComplete={soundComplete}
              setupTrigger={soundSetupTrigger}
              onReload={reload}
              onToast={showToast}
              onStartSoundSetup={() => setSoundSetupTrigger((value) => value + 1)}
              onViewSound={() => scrollTo("sound")}
            />
          </div>
          <div id="cameras" className="scroll-mt-4">
            <CamerasSection
              cameras={data.cameras}
              setupTrigger={cameraSetupTrigger}
              onReload={reload}
              onToast={showToast}
            />
          </div>
          <div id="internet" className="scroll-mt-4">
            <InternetSection
              connections={data.internetConnections}
              equipmentProfile={data.equipmentProfile}
              onReload={reload}
              onToast={showToast}
            />
          </div>
          <div id="streaming" className="scroll-mt-4">
            <Suspense fallback={<SectionPlaceholder minHeight="220px" />}>
              <StreamingSection
                destinations={data.streamingDestinations}
                broadcastDestinationCards={data.broadcastDestinationCards ?? []}
                soundItems={data.soundItems}
                onReload={reload}
                onToast={showToast}
              />
            </Suspense>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          <div id="recording" className="scroll-mt-4">
            <RecordingSection settings={data.recordingSettings} onReload={reload} onToast={showToast} />
          </div>
          <div id="presentation" className="scroll-mt-4">
            <PresentationSection sources={data.presentationSources} onReload={reload} onToast={showToast} />
          </div>
          <div id="timeline" className="scroll-mt-4">
            <ServiceTimeline items={data.timelineItems} onReload={reload} onToast={showToast} />
          </div>
          <div id="team" className="scroll-mt-4">
            <TeamSection members={data.teamMembers} onReload={reload} onToast={showToast} />
          </div>
          <div id="alerts" className="scroll-mt-4 md:col-span-2 xl:col-span-1 2xl:col-span-1">
            <AttentionSection
              alerts={data.alerts}
              onReload={reload}
              onToast={showToast}
              onFixIssues={() => scrollTo("sound")}
            />
          </div>
        </div>

      <QuickActions
        cameras={data.cameras}
        destinations={data.streamingDestinations}
        onReload={reload}
        onToast={showToast}
        onBeginService={() => void handleBeginService()}
      />

      {isEditServiceOpen ? (
        <EditServiceModal
          open={isEditServiceOpen}
          service={data.service}
          saving={savingHeader}
          saveError={headerSaveError}
          onClose={() => setIsEditServiceOpen(false)}
          onSave={handleSaveHeader}
        />
      ) : null}

      {isChangeProfileOpen ? (
        <ChangeProfileModal
          open={isChangeProfileOpen}
          service={data.service}
          saving={savingProfile}
          saveError={profileSaveError}
          onClose={() => setIsChangeProfileOpen(false)}
          onSave={handleSaveProfile}
        />
      ) : null}

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2 font-ui text-sm shadow-lg ${
            toast.type === "success"
              ? "border border-green-500/40 bg-green-900/90 text-white"
              : "border border-red-500/40 bg-red-900/90 text-white"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      {beginConfirm ? (
        (() => {
          const churchIssues = beginConfirm?.streamingGate?.needsAttention.filter((d) => d.platform === "church_website") ?? [];
          const hasChurchIssue = churchIssues.length > 0;
          const firstChurchIssue = churchIssues[0] ?? null;
          return (
        <DeleteConfirmDialog
          open={Boolean(beginConfirm)}
          title={
            hasChurchIssue
              ? "Church Website needs attention"
              : beginConfirm?.streamingGate
                ? "Some streaming destinations need attention"
                : "Begin Service Anyway?"
          }
          message={
            beginConfirm?.streamingGate
              ? [
                  ...beginConfirm.streamingGate.ready.map((d) => `${d.displayName} is ready.`),
                  ...beginConfirm.streamingGate.needsAttention.map((d) => `${d.displayName}: ${d.message}`),
                  "",
                  "You can fix the issue, skip destinations that need attention, or cancel going live.",
                ].join("\n")
              : beginConfirm
                ? `These issues still need attention:\n${beginConfirm.issues.join("\n")}\n\nDo you want to begin service anyway?`
                : ""
          }
          onConfirm={() =>
            void confirmBegin(beginConfirm?.streamingGate?.needsAttention.map((d) => d.id) ?? [])
          }
          onClose={() => setBeginConfirm(null)}
          confirming={beginning}
          confirmLabel={
            hasChurchIssue
              ? "Continue Without Website"
              : beginConfirm?.streamingGate
                ? "Skip Failed & Go Live"
                : "Begin Service"
          }
          secondaryLabel={beginConfirm?.streamingGate ? (hasChurchIssue ? "Test Again" : "Retry") : undefined}
          onSecondary={beginConfirm?.streamingGate ? () => void retryStreamingBegin() : undefined}
          tertiaryLabel={beginConfirm?.streamingGate ? (hasChurchIssue ? "Fix Website" : "Fix Now") : undefined}
          onTertiary={
            beginConfirm?.streamingGate
              ? () => {
                  setBeginConfirm(null);
                  if (firstChurchIssue?.id) {
                    window.dispatchEvent(
                      new CustomEvent("streaming:open-wizard", {
                        detail: { destinationId: firstChurchIssue.id, step: "authenticate" },
                      }),
                    );
                    scrollTo("streaming");
                    return;
                  }
                  scrollTo("streaming");
                }
              : undefined
          }
        />
          );
        })()
      ) : null}
    </>
  );
}
