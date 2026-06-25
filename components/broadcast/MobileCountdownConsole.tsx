"use client";

import CountdownPreviewPlayer from "@/components/broadcast/CountdownPreviewPlayer";
import GoLiveConfirmModal from "@/components/broadcast/GoLiveConfirmModal";
import HeroCopyEditorPanel from "@/components/broadcast/HeroCopyEditorPanel";
import MobileActionDock from "@/components/broadcast/MobileActionDock";
import MobileEditorTabs, { type MobileEditorTab } from "@/components/broadcast/MobileEditorTabs";
import PermissionsPanel from "@/components/broadcast/PermissionsPanel";
import RealtimeChatFeed from "@/components/broadcast/RealtimeChatFeed";
import ResponsiveStatusBanner from "@/components/broadcast/ResponsiveStatusBanner";
import ResponsiveStatusStrip from "@/components/broadcast/ResponsiveStatusStrip";
import ShowSchedulePanel from "@/components/broadcast/ShowSchedulePanel";
import TroubleAlertPopup from "@/components/broadcast/TroubleAlertPopup";
import type {
  HeroCopyFormState,
  OpsStreamTelemetryView,
  RoleGateResult,
} from "@/lib/broadcast/countdown-console-types";
import type { RealtimeAttendeeChatRow } from "@/lib/broadcast/countdown-console-types";
import type { ChatTroubleCategory } from "@/lib/ops/chat-scanner";

type MobileCountdownConsoleProps = {
  adminEmail: string;
  playbackUrl: string | null;
  opsStream: OpsStreamTelemetryView | null;
  formState: HeroCopyFormState;
  roleGate: RoleGateResult;
  chatMessages: RealtimeAttendeeChatRow[];
  chatLoading: boolean;
  chatConnected: boolean;
  issueType: ChatTroubleCategory | null;
  troubleCount: number;
  mobileTab: MobileEditorTab;
  onMobileTabChange: (tab: MobileEditorTab) => void;
  isSaving: boolean;
  saveSuccess: boolean;
  saveError: string | null;
  launchError: string | null;
  isLaunching: boolean;
  isGoLiveOpen: boolean;
  onFieldChange: <K extends keyof HeroCopyFormState>(
    key: K,
    value: HeroCopyFormState[K],
  ) => void;
  onSave: () => void;
  onReset: () => void;
  onGoLiveOpen: () => void;
  onGoLiveClose: () => void;
  onGoLiveConfirm: () => void;
  onClearAlert: () => void;
};

export default function MobileCountdownConsole({
  adminEmail,
  playbackUrl,
  opsStream,
  formState,
  roleGate,
  chatMessages,
  chatLoading,
  chatConnected,
  issueType,
  troubleCount,
  mobileTab,
  onMobileTabChange,
  isSaving,
  saveSuccess,
  saveError,
  launchError,
  isLaunching,
  isGoLiveOpen,
  onFieldChange,
  onSave,
  onReset,
  onGoLiveOpen,
  onGoLiveClose,
  onGoLiveConfirm,
  onClearAlert,
}: MobileCountdownConsoleProps) {
  const isLive = opsStream?.isLive === true;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-brand-black pb-24 text-white lg:hidden">
      <div className="sticky top-0 z-30 w-full shrink-0 border-b border-brand-border bg-brand-black">
        <ResponsiveStatusBanner isLive={isLive} />
        <CountdownPreviewPlayer playbackUrl={playbackUrl} className="rounded-none border-0" />
      </div>

      <div className="p-3">
        <ResponsiveStatusStrip opsStream={opsStream} variant="mobile" />
      </div>

      {launchError || saveError ? (
        <div className="px-3 pb-2">
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 font-body text-xs text-red-200">
            {launchError ?? saveError}
          </p>
        </div>
      ) : null}

      <MobileEditorTabs activeTab={mobileTab} onTabChange={onMobileTabChange} />

      {mobileTab === "editor" ? (
        <div className="space-y-4 px-3 py-4">
          <HeroCopyEditorPanel
            formState={formState}
            canEdit={roleGate.canEdit}
            canSave={roleGate.canSave}
            isSaving={isSaving}
            saveSuccess={saveSuccess}
            saveError={null}
            onFieldChange={onFieldChange}
            onSave={onSave}
            showSaveButton={false}
          />
          <ShowSchedulePanel
            formState={formState}
            canEdit={roleGate.canEdit}
            canSave={roleGate.canSave}
            isSaving={isSaving}
            saveSuccess={saveSuccess}
            saveError={saveError}
            onFieldChange={onFieldChange}
            onSave={onSave}
            onReset={onReset}
          />
          <PermissionsPanel role={roleGate.role} />
        </div>
      ) : (
        <div className="min-h-[45vh] px-3 py-3">
          <RealtimeChatFeed
            messages={chatMessages}
            isLoading={chatLoading}
            isConnected={chatConnected}
            variant="mobile"
          />
        </div>
      )}

      <MobileActionDock
        onSettingsClick={() => onMobileTabChange("editor")}
        onSaveClick={onSave}
        onGoLiveClick={onGoLiveOpen}
        canSave={roleGate.canSave}
        canGoLive={roleGate.canGoLive}
        isSaving={isSaving}
        isLive={isLive}
        saveLabel={saveSuccess ? "Saved" : undefined}
      />

      <TroubleAlertPopup
        issueType={issueType}
        count={troubleCount}
        onClear={onClearAlert}
        canClear={roleGate.canClearAlerts}
        variant="mobile"
      />

      <GoLiveConfirmModal
        isOpen={isGoLiveOpen}
        isLaunching={isLaunching}
        alreadyLive={isLive}
        onClose={onGoLiveClose}
        onConfirm={onGoLiveConfirm}
      />
    </div>
  );
}
