"use client";

import Link from "next/link";
import { ArrowLeft, CloudLightning, Loader2, Save } from "lucide-react";
import CountdownPreviewPlayer from "@/components/broadcast/CountdownPreviewPlayer";
import GoLiveConfirmModal from "@/components/broadcast/GoLiveConfirmModal";
import HeroCopyEditorPanel from "@/components/broadcast/HeroCopyEditorPanel";
import PermissionsPanel from "@/components/broadcast/PermissionsPanel";
import RealtimeChatFeed from "@/components/broadcast/RealtimeChatFeed";
import ResponsiveStatusBanner from "@/components/broadcast/ResponsiveStatusBanner";
import ResponsiveStatusStrip from "@/components/broadcast/ResponsiveStatusStrip";
import ShowSchedulePanel from "@/components/broadcast/ShowSchedulePanel";
import TroubleAlertPopup from "@/components/broadcast/TroubleAlertPopup";
import type { HeroCopyFormState, OpsStreamTelemetryView, RoleGateResult, TroubleAlert } from "@/lib/broadcast/countdown-console-types";
import type { RealtimeAttendeeChatRow } from "@/lib/broadcast/countdown-console-types";
import { OPS_HOME_PATH } from "@/lib/broadcastRoutes";

type DesktopCountdownConsoleProps = {
  adminEmail: string;
  playbackUrl: string | null;
  opsStream: OpsStreamTelemetryView | null;
  formState: HeroCopyFormState;
  roleGate: RoleGateResult;
  chatMessages: RealtimeAttendeeChatRow[];
  chatLoading: boolean;
  chatConnected: boolean;
  activeAlert: TroubleAlert | null;
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
  activeAlert,
  isSaving,
  saveSuccess,
  saveError,
  launchError,
  isLaunching,
  isGoLiveOpen,
  onFieldChange,
  onSave,
  onGoLiveOpen,
  onGoLiveClose,
  onGoLiveConfirm,
  onClearAlert,
}: DesktopCountdownConsoleProps) {
  const isLive = opsStream?.isLive === true;

  return (
    <div className="hidden h-screen overflow-hidden bg-brand-black text-white lg:grid lg:grid-cols-[40%_1fr]">
      <div className="h-full space-y-4 overflow-y-auto border-r border-brand-border/50 p-5">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={OPS_HOME_PATH}
            prefetch={false}
            className="inline-flex min-h-10 items-center gap-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-brand-muted hover:text-brand-blue"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Ops
          </Link>
          <p className="truncate font-body text-xs text-brand-muted">{adminEmail}</p>
        </div>

        <HeroCopyEditorPanel
          formState={formState}
          canEdit={roleGate.canEdit}
          canSave={roleGate.canSave}
          isSaving={isSaving}
          saveSuccess={saveSuccess}
          saveError={saveError}
          onFieldChange={onFieldChange}
          onSave={onSave}
        />

        <ShowSchedulePanel
          formState={formState}
          canEdit={roleGate.canEdit}
          onFieldChange={onFieldChange}
        />

        <PermissionsPanel role={roleGate.role} />
      </div>

      <div className="flex h-full flex-col gap-4 overflow-hidden p-5">
        <ResponsiveStatusBanner isLive={isLive} />

        <CountdownPreviewPlayer playbackUrl={playbackUrl} />

        <ResponsiveStatusStrip opsStream={opsStream} variant="desktop" />

        <RealtimeChatFeed
          messages={chatMessages}
          isLoading={chatLoading}
          isConnected={chatConnected}
          variant="desktop"
        />

        <div className="flex shrink-0 justify-end gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={!roleGate.canSave || isSaving}
            className="touch-target inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-border bg-brand-panel px-4 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {roleGate.canSave ? "Save" : "Read Only"}
          </button>
          <button
            type="button"
            onClick={onGoLiveOpen}
            disabled={!roleGate.canGoLive || isLive}
            className="touch-target inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-pink px-4 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white enabled:hover:bg-brand-pink/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CloudLightning className="h-4 w-4" />
            Go Live
          </button>
        </div>

        {launchError ? (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 font-body text-xs text-red-200">
            {launchError}
          </p>
        ) : null}
      </div>

      <TroubleAlertPopup
        alert={activeAlert}
        onClear={onClearAlert}
        canClear={roleGate.canClearAlerts}
        variant="desktop"
      />

      <GoLiveConfirmModal
        isOpen={isGoLiveOpen}
        isLaunching={isLaunching}
        onClose={onGoLiveClose}
        onConfirm={onGoLiveConfirm}
      />
    </div>
  );
}
