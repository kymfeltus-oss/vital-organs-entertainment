"use client";

import { useCallback, useMemo, useState } from "react";
import DesktopCountdownConsole from "@/components/broadcast/DesktopCountdownConsole";
import MobileCountdownConsole from "@/components/broadcast/MobileCountdownConsole";
import type { MobileEditorTab } from "@/components/broadcast/MobileEditorTabs";
import { toOpsStreamTelemetryView, resolvePreviewPlaybackUrl } from "@/lib/broadcast/ops-stream-telemetry-view";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import { useCountdownHeroEditor } from "@/hooks/useCountdownHeroEditor";
import { useOpsStreamStateRealtime } from "@/hooks/useOpsStreamStateRealtime";
import { useRealtimeAttendeeChat } from "@/hooks/useRealtimeAttendeeChat";
import { useRoleGate } from "@/hooks/useRoleGate";
import { useTroubleAlertScanner } from "@/hooks/useTroubleAlertScanner";

type CountdownCommandConsoleProps = {
  adminEmail: string;
  initialConfig: EventCountdownConfig;
};

/** Modular countdown hero production command console — desktop + mobile layouts. */
export default function CountdownCommandConsole({
  adminEmail,
  initialConfig,
}: CountdownCommandConsoleProps) {
  const roleGate = useRoleGate();
  const { stream, opsState } = useOpsStreamStateRealtime();
  const opsStream = useMemo(
    () => toOpsStreamTelemetryView(opsState, stream),
    [opsState, stream],
  );
  const playbackUrl = useMemo(() => resolvePreviewPlaybackUrl(stream), [stream]);

  const {
    formState,
    setField,
    saveHeroCopyForm,
    resetToLoadedState,
    launchBroadcast,
    isSaving,
    saveError,
    saveSuccess,
    isLaunching,
    launchError,
  } = useCountdownHeroEditor({ initialConfig });

  const { messages, isLoading: chatLoading, isConnected: chatConnected } =
    useRealtimeAttendeeChat({ enabled: true });
  const { activeAlert, clearAlert } = useTroubleAlertScanner(messages);

  const [mobileTab, setMobileTab] = useState<MobileEditorTab>("editor");
  const [isGoLiveOpen, setIsGoLiveOpen] = useState(false);

  const handleSave = useCallback(() => {
    void saveHeroCopyForm();
  }, [saveHeroCopyForm]);

  const handleGoLiveConfirm = useCallback(async () => {
    const ok = await launchBroadcast();
    if (ok) {
      setIsGoLiveOpen(false);
    }
  }, [launchBroadcast]);

  const sharedProps = {
    adminEmail,
    playbackUrl,
    opsStream,
    formState,
    roleGate,
    chatMessages: messages,
    chatLoading,
    chatConnected,
    issueType: activeAlert?.type ?? null,
    troubleCount: activeAlert?.count ?? 0,
    isSaving,
    saveSuccess,
    saveError,
    launchError,
    isLaunching,
    isGoLiveOpen,
    onFieldChange: setField,
    onSave: handleSave,
    onReset: resetToLoadedState,
    onGoLiveOpen: () => setIsGoLiveOpen(true),
    onGoLiveClose: () => setIsGoLiveOpen(false),
    onGoLiveConfirm: () => void handleGoLiveConfirm(),
    onClearAlert: clearAlert,
  };

  return (
    <main className="min-h-dvh w-full bg-brand-black pt-safe text-white">
      <MobileCountdownConsole
        {...sharedProps}
        mobileTab={mobileTab}
        onMobileTabChange={setMobileTab}
      />
      <DesktopCountdownConsole {...sharedProps} />
    </main>
  );
}
