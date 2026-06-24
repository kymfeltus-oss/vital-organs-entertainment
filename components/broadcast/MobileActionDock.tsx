"use client";

import { AlertTriangle, CloudLightning, Loader2, Save, Settings } from "lucide-react";

type MobileActionDockProps = {
  onSettingsClick: () => void;
  onSaveClick: () => void;
  onGoLiveClick: () => void;
  canSave: boolean;
  canGoLive: boolean;
  isSaving: boolean;
  isLive: boolean;
  saveLabel?: string;
};

export default function MobileActionDock({
  onSettingsClick,
  onSaveClick,
  onGoLiveClick,
  canSave,
  canGoLive,
  isSaving,
  isLive,
  saveLabel,
}: MobileActionDockProps) {
  const saveText = !canSave
    ? "Read Only"
    : isSaving
      ? "Saving…"
      : saveLabel ?? "Save";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-border bg-brand-panel/95 pb-safe backdrop-blur-md">
      <div className="grid grid-cols-3 gap-2 p-3">
        <button
          type="button"
          onClick={onSettingsClick}
          aria-label="Open editor settings"
          className="touch-target flex flex-col items-center justify-center gap-1 rounded-xl border border-brand-border bg-brand-black/60 px-2 py-2.5 font-ui text-[0.48rem] font-bold uppercase tracking-[0.12em] text-brand-muted transition-colors hover:border-brand-purple/40 hover:text-white"
        >
          <Settings className="h-5 w-5 text-brand-purple" aria-hidden="true" />
          <span>Settings</span>
        </button>

        <button
          type="button"
          onClick={onSaveClick}
          disabled={!canSave || isSaving}
          aria-label="Save countdown configuration"
          className="touch-target flex flex-col items-center justify-center gap-1 rounded-xl border border-brand-border bg-brand-black/60 px-2 py-2.5 font-ui text-[0.48rem] font-bold uppercase tracking-[0.12em] text-white transition-colors enabled:hover:border-brand-blue/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? (
            <Loader2 className="h-5 w-5 animate-spin text-brand-blue" aria-hidden="true" />
          ) : (
            <Save className="h-5 w-5 text-brand-blue" aria-hidden="true" />
          )}
          <span>{saveText}</span>
        </button>

        <button
          type="button"
          onClick={onGoLiveClick}
          disabled={!canGoLive}
          aria-label={isLive ? "Broadcast is live — re-sync schedule" : "Go live to attendees"}
          className="touch-target flex flex-col items-center justify-center gap-1 rounded-xl border border-brand-pink/40 bg-brand-pink px-2 py-2.5 font-ui text-[0.48rem] font-bold uppercase tracking-[0.12em] text-white transition-colors enabled:hover:bg-brand-pink/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CloudLightning className="h-5 w-5" aria-hidden="true" />
          <span>{isLive ? "Re-sync" : "Go Live"}</span>
        </button>
      </div>
    </div>
  );
}
