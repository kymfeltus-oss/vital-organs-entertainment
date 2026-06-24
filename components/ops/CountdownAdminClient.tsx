"use client";

import { useCallback, useMemo, useState } from "react";
import DesktopCountdownConsole from "@/components/broadcast/DesktopCountdownConsole";
import MobileCountdownConsole from "@/components/broadcast/MobileCountdownConsole";
import type { MobileEditorTab } from "@/components/broadcast/MobileEditorTabs";
import type { RealtimeAttendeeChatRow } from "@/lib/broadcast/countdown-console-types";
import {
  resolvePreviewPlaybackUrl,
  toOpsStreamTelemetryView,
} from "@/lib/broadcast/ops-stream-telemetry-view";
import { useCountdownChatTroubleAlerts } from "@/hooks/useCountdownChatTroubleAlerts";
import { useCountdownHeroEditor } from "@/hooks/useCountdownHeroEditor";
import { useOpsStreamStateRealtime } from "@/hooks/useOpsStreamStateRealtime";
import { useRoleGate } from "@/hooks/useRoleGate";
import type { FellowshipChatMessage } from "@/lib/experience/fellowship-chat";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";

type CountdownAdminClientProps = {
  adminEmail: string;
  initialConfig: EventCountdownConfig;
  /** Server snapshot — retained for SSR parity with page loader. */
  initialPreviewNowMs?: number;
};

function mapAttendeeChatRows(
  messages: FellowshipChatMessage[],
): RealtimeAttendeeChatRow[] {
  return messages.map((message) => ({
    id: message.id,
    username: message.author,
    message: message.body,
    created_at: message.createdAt,
  }));
}

/** Ops countdown production command console — desktop + mobile layouts. */
export default function CountdownAdminClient({
  adminEmail,
  initialConfig,
}: CountdownAdminClientProps) {
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

  const {
    messages,
    isLoading: chatLoading,
    isConnected: chatConnected,
    issueType,
    count: troubleCount,
    clear: clearChatAlert,
  } = useCountdownChatTroubleAlerts();

  const chatMessages = useMemo(() => mapAttendeeChatRows(messages), [messages]);

  const [mobileTab, setMobileTab] = useState<MobileEditorTab>("editor");
  const [isGoLiveOpen, setIsGoLiveOpen] = useState(false);

  const handleSave = useCallback(() => {
    void saveHeroCopyForm();
  }, [saveHeroCopyForm]);

  const handleReset = useCallback(() => {
    resetToLoadedState();
  }, [resetToLoadedState]);

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
    onFieldChange: setField,
    onSave: handleSave,
    onReset: handleReset,
    onGoLiveOpen: () => setIsGoLiveOpen(true),
    onGoLiveClose: () => setIsGoLiveOpen(false),
    onGoLiveConfirm: () => void handleGoLiveConfirm(),
    onClearAlert: clearChatAlert,
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
