"use client";

import { CloudLightning, Loader2 } from "lucide-react";
import CountdownPreviewPlayer from "@/components/broadcast/CountdownPreviewPlayer";
import GoLiveConfirmModal from "@/components/broadcast/GoLiveConfirmModal";
import HeroCopyEditorPanel from "@/components/broadcast/HeroCopyEditorPanel";
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

type DesktopCountdownConsoleProps = {
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

export default function DesktopCountdownConsole({
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
}: DesktopCountdownConsoleProps) {
  const isLive = opsStream?.isLive === true;

  return (
    <div className="hidden min-h-0 flex-1 flex-col overflow-hidden bg-brand-black text-white lg:flex">
      <ResponsiveStatusBanner isLive={isLive} />

      <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(280px,32%)_1fr]">
      <div className="h-full space-y-4 overflow-y-auto border-r border-brand-border p-4">
        <p className="truncate font-body text-xs text-brand-muted">{adminEmail}</p>

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

        <button
          type="button"
          onClick={onGoLiveOpen}
          disabled={!roleGate.canGoLive || isLaunching}
          aria-label={isLive ? "Re-sync live broadcast to attendees" : "Go live to attendees"}
          className="touch-target inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand-pink/50 bg-brand-pink px-4 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white transition enabled:hover:bg-brand-pink/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLaunching ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <CloudLightning className="h-4 w-4" aria-hidden="true" />
          )}
          {isLive ? "On Air — Re-sync" : "Go Live"}
        </button>

        {launchError ? (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 font-body text-xs text-red-200">
            {launchError}
          </p>
        ) : null}
      </div>

      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4">
        <CountdownPreviewPlayer playbackUrl={playbackUrl} className="shrink-0 rounded-xl" />

        <ResponsiveStatusStrip opsStream={opsStream} variant="desktop" />

        <RealtimeChatFeed
          messages={chatMessages}
          isLoading={chatLoading}
          isConnected={chatConnected}
          variant="desktop"
        />
      </div>
      </div>

      <TroubleAlertPopup
        issueType={issueType}
        count={troubleCount}
        onClear={onClearAlert}
        canClear={roleGate.canClearAlerts}
        variant="desktop"
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
