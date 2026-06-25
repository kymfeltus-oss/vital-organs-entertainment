"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Loader2, X } from "lucide-react";
import CountdownPreviewPlayer from "@/components/broadcast/CountdownPreviewPlayer";
import HeroCopyEditorPanel from "@/components/broadcast/HeroCopyEditorPanel";
import PermissionsPanel from "@/components/broadcast/PermissionsPanel";
import RealtimeChatFeed from "@/components/broadcast/RealtimeChatFeed";
import ResponsiveStatusStrip from "@/components/broadcast/ResponsiveStatusStrip";
import ShowSchedulePanel from "@/components/broadcast/ShowSchedulePanel";
import CameraDeskMobileView from "@/components/ops/CameraDeskMobileView";
import HostIngestPanel from "@/components/ops/camera/HostIngestPanel";
import OpsDrawer from "@/components/ops/OpsDrawer";
import OpsIncidentDrawerContent from "@/components/ops/countdown/OpsIncidentDrawerContent";
import OpsPrayerQueueDrawerContent from "@/components/ops/countdown/OpsPrayerQueueDrawerContent";
import OpsViewTabs from "@/components/ops/shell/OpsViewTabs";
import { useCountdownChatTroubleAlerts } from "@/hooks/useCountdownChatTroubleAlerts";
import { useCountdownHeroEditor } from "@/hooks/useCountdownHeroEditor";
import { useOpsStreamStateRealtime } from "@/hooks/useOpsStreamStateRealtime";
import { useRoleGate } from "@/hooks/useRoleGate";
import type { RealtimeAttendeeChatRow } from "@/lib/broadcast/countdown-console-types";
import {
  resolvePreviewPlaybackUrl,
  toOpsStreamTelemetryView,
} from "@/lib/broadcast/ops-stream-telemetry-view";
import type { FellowshipChatMessage } from "@/lib/experience/fellowship-chat";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { LiveHubHeartbeatPayload } from "@/lib/ops/live-hub-heartbeat";
import { SILENT_METER_FLOOR } from "@/lib/ops/ops-stream-state";
import {
  buildOpsModuleHref,
  OPS_MODULE_ROUTES,
} from "@/lib/ops/ops-module-nav";
import { splitRtmpIngestUrl } from "@/lib/stream-keys";
import type { OpsSnapshot, OpsStreamAction } from "@/lib/ops/types";

const COUNTDOWN_MODULE_VIEWS = ["console", "camera", "incident", "prayer"] as const;
type CountdownModuleView = (typeof COUNTDOWN_MODULE_VIEWS)[number];

type OpsCountdownModuleClientProps = {
  adminEmail: string;
  initialConfig: EventCountdownConfig;
  initialSnapshot: OpsSnapshot;
};

type PreflightChecks = {
  ingestPath: boolean;
  encoderConnectivity: boolean | null;
  masterBusAudio: boolean;
  countdownSchedule: boolean;
  rehearsalGate: boolean;
};

function resolveCountdownView(raw: string | null): CountdownModuleView {
  if (raw === "camera" || raw === "incident" || raw === "prayer") return raw;
  return "console";
}

function mapAttendeeChatRows(messages: FellowshipChatMessage[]): RealtimeAttendeeChatRow[] {
  return messages.map((message) => ({
    id: message.id,
    username: message.author,
    message: message.body,
    created_at: message.createdAt,
  }));
}

function ConsoleHeaderBanner({ isLive }: { isLive: boolean }) {
  if (isLive) {
    return (
      <div
        className="w-full border-2 border-brand-pink bg-brand-pink/20 py-2.5 text-center font-ui text-xs font-bold uppercase tracking-[0.24em] text-brand-pink motion-safe:animate-pulse"
        role="status"
      >
        Stream: Live
      </div>
    );
  }

  return (
    <div
      className="w-full border-2 border-brand-pink bg-brand-purple/30 py-2.5 text-center font-ui text-xs font-bold uppercase tracking-[0.24em] text-purple-300"
      role="status"
    >
      Rehearsal Standby
    </div>
  );
}

function CameraMatrixGrid({ stream }: { stream: OpsSnapshot["stream"] | null }) {
  const slots = [
    { label: "Slot 1 — Primary ingest", value: stream?.primaryRtmpConfigured ? "Valid" : "Missing" },
    { label: "Slot 2 — Backup ingest", value: stream?.backupConfigured ? "Valid" : "Optional" },
    { label: "Slot 3 — RTMP pull", value: stream?.primaryRtmpPullConfigured ? "Configured" : "Missing" },
    { label: "Slot 4 — HLS preview", value: stream?.cameraPreviewConfigured ? "Configured" : "Missing" },
    { label: "Slot 5 — Active source", value: stream?.activeSource ?? "offline" },
    { label: "Slot 6 — Mobile key", value: stream?.activeMobileStreamKey ? "Active" : "None" },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {slots.map((slot) => (
        <div key={slot.label} className="glass-panel rounded-xl border border-brand-border p-4">
          <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
            {slot.label}
          </p>
          <p className="mt-2 font-ui text-sm font-bold uppercase text-white">{slot.value}</p>
        </div>
      ))}
    </div>
  );
}

function PreflightReadinessPanel({
  checks,
  rehearsalMode,
  onRehearsalModeChange,
}: {
  checks: PreflightChecks;
  rehearsalMode: boolean;
  onRehearsalModeChange: (value: boolean) => void;
}) {
  const rows: { key: keyof PreflightChecks; label: string; ok: boolean | null }[] = [
    {
      key: "ingestPath",
      label: "Ingest Path State (RTMP 1935 telemetry connected)",
      ok: checks.ingestPath,
    },
    {
      key: "encoderConnectivity",
      label: "Encoder Connectivity Status (vMix API ping)",
      ok: checks.encoderConnectivity,
    },
    {
      key: "masterBusAudio",
      label: "Master Bus Audio Signal (volume activity verification)",
      ok: checks.masterBusAudio,
    },
    {
      key: "countdownSchedule",
      label: "Saved Countdown Schedule Status (calendar start_time exists)",
      ok: checks.countdownSchedule,
    },
    {
      key: "rehearsalGate",
      label: "Rehearsal Interlock Gate (Rehearsal Mode must be OFF to go live)",
      ok: checks.rehearsalGate,
    },
  ];

  return (
    <section className="glass-panel rounded-2xl border border-brand-border p-4 md:p-5">
      <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white">
        Pre-Flight Readiness Interlock
      </h2>
      <p className="mt-1 font-body text-xs text-brand-muted">
        Phase 3 checklist — all critical items must pass before go-live.
      </p>

      <ul className="mt-4 space-y-2">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-start gap-2 rounded-lg border border-brand-border bg-brand-black/40 px-3 py-2 font-body text-sm"
          >
            <span
              className={
                row.ok === null
                  ? "text-brand-muted"
                  : row.ok
                    ? "text-emerald-400"
                    : "text-amber-400"
              }
              aria-hidden="true"
            >
              {row.ok === null ? "◌" : row.ok ? "☑" : "☐"}
            </span>
            <span className={row.ok === false ? "text-amber-200" : "text-white"}>{row.label}</span>
          </li>
        ))}
      </ul>

      <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-brand-border bg-brand-black/50 px-3 py-2.5">
        <span className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
          Rehearsal Mode
        </span>
        <input
          type="checkbox"
          checked={rehearsalMode}
          onChange={(event) => onRehearsalModeChange(event.target.checked)}
          className="h-5 w-5 accent-brand-purple"
        />
      </label>
    </section>
  );
}

function ActionControlStrip({
  blocked,
  pending,
  actionMessage,
  canMutate,
  onGoLive,
  onSwitchBackup,
  onEmergencyOffline,
}: {
  blocked: boolean;
  pending: OpsStreamAction | "go_live_hub" | null;
  actionMessage: string | null;
  canMutate: boolean;
  onGoLive: () => void;
  onSwitchBackup: () => void;
  onEmergencyOffline: () => void;
}) {
  const disabled = blocked || !canMutate || pending != null;

  return (
    <section className="glass-panel rounded-2xl border border-brand-border p-4 md:p-5">
      <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white">
        Action Sequence Control
      </h2>
      <p className="mt-1 font-body text-xs text-brand-muted">
        Orchestrated live switch — Restream, vMix, and platform visibility.
      </p>

      {blocked ? (
        <p className="mt-3 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 font-ui text-xs font-semibold uppercase tracking-[0.08em] text-amber-300">
          Go Live Blocked: Clear interlock checks above to proceed.
        </p>
      ) : null}

      {actionMessage ? (
        <p
          className={`mt-3 rounded-lg border px-3 py-2 font-body text-xs ${
            /fail|error|block/i.test(actionMessage)
              ? "border-brand-pink/40 bg-brand-pink/10 text-brand-pink"
              : "border-brand-blue/30 bg-brand-blue/10 text-white"
          }`}
          role="status"
        >
          {actionMessage}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          disabled={disabled}
          onClick={onGoLive}
          className="touch-target rounded-xl bg-brand-pink py-3 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending === "go_live_hub" ? "Working…" : "Confirm & Go Live"}
        </button>
        <button
          type="button"
          disabled={disabled && pending !== "switch_backup"}
          onClick={onSwitchBackup}
          className="touch-target rounded-xl bg-brand-purple py-3 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending === "switch_backup" ? "Working…" : "Switch to Backup"}
        </button>
        <button
          type="button"
          disabled={!canMutate || pending != null}
          onClick={onEmergencyOffline}
          className="touch-target rounded-xl border border-brand-pink/50 bg-brand-pink/15 py-3 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-brand-pink disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending === "emergency_offline" ? "Working…" : "Emergency Offline"}
        </button>
      </div>
    </section>
  );
}

function AudienceAlertBanner({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  if (!visible) return null;

  return (
    <div
      className="pointer-events-auto fixed bottom-4 right-4 z-[70] w-[min(100vw-2rem,24rem)] rounded-xl border border-amber-500/70 bg-brand-panel p-4 shadow-2xl shadow-amber-500/10"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h4 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.16em] text-amber-400">
            Audience Alert — Audio Critical
          </h4>
          <p className="mt-1 font-body text-sm leading-snug text-white">
            Multiple viewers are reporting they CANNOT HEAR the broadcast right now! Check vMix audio
            bus matrix.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="touch-target shrink-0 text-brand-muted hover:text-white"
          aria-label="Dismiss audience alert"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

type ConsoleViewProps = {
  isLive: boolean;
  playbackUrl: string | null;
  opsStream: ReturnType<typeof toOpsStreamTelemetryView>;
  chatMessages: RealtimeAttendeeChatRow[];
  chatLoading: boolean;
  chatConnected: boolean;
  roleGate: ReturnType<typeof useRoleGate>;
  formState: ReturnType<typeof useCountdownHeroEditor>["formState"];
  isSaving: boolean;
  saveSuccess: boolean;
  saveError: string | null;
  onFieldChange: ReturnType<typeof useCountdownHeroEditor>["setField"];
  onSave: () => void;
  onReset: () => void;
  preflight: PreflightChecks;
  rehearsalMode: boolean;
  onRehearsalModeChange: (value: boolean) => void;
  goLiveBlocked: boolean;
  pendingAction: OpsStreamAction | "go_live_hub" | null;
  actionMessage: string | null;
  onGoLive: () => void;
  onSwitchBackup: () => void;
  onEmergencyOffline: () => void;
  showAudienceAlert: boolean;
  onClearAudienceAlert: () => void;
};

function ConsoleMasterControlCenter({
  isLive,
  playbackUrl,
  opsStream,
  chatMessages,
  chatLoading,
  chatConnected,
  roleGate,
  formState,
  isSaving,
  saveSuccess,
  saveError,
  onFieldChange,
  onSave,
  onReset,
  preflight,
  rehearsalMode,
  onRehearsalModeChange,
  goLiveBlocked,
  pendingAction,
  actionMessage,
  onGoLive,
  onSwitchBackup,
  onEmergencyOffline,
  showAudienceAlert,
  onClearAudienceAlert,
}: ConsoleViewProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
      <ConsoleHeaderBanner isLive={isLive} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <HeroCopyEditorPanel
            formState={formState}
            canEdit={roleGate.canEdit}
            canSave={roleGate.canSave}
            isSaving={isSaving}
            saveSuccess={saveSuccess}
            saveError={saveError}
            onFieldChange={onFieldChange}
            onSave={onSave}
            showSaveButton
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

        <div className="flex flex-col gap-4">
          <div className="relative">
            <CountdownPreviewPlayer playbackUrl={playbackUrl} className="rounded-xl" />
            {isLive ? (
              <span className="pointer-events-none absolute left-3 top-3 rounded-md border border-brand-pink bg-brand-pink/90 px-2 py-1 font-ui text-[0.52rem] font-bold uppercase tracking-[0.14em] text-white motion-safe:animate-pulse">
                Live
              </span>
            ) : null}
          </div>

          <ResponsiveStatusStrip opsStream={opsStream} variant="desktop" />

          <div className="h-[min(50vh,420px)] min-h-[240px]">
            <RealtimeChatFeed
              messages={chatMessages}
              isLoading={chatLoading}
              isConnected={chatConnected}
              variant="desktop"
            />
          </div>
        </div>
      </div>

      <PreflightReadinessPanel
        checks={preflight}
        rehearsalMode={rehearsalMode}
        onRehearsalModeChange={onRehearsalModeChange}
      />

      <ActionControlStrip
        blocked={goLiveBlocked}
        pending={pendingAction}
        actionMessage={actionMessage}
        canMutate={roleGate.canGoLive}
        onGoLive={onGoLive}
        onSwitchBackup={onSwitchBackup}
        onEmergencyOffline={onEmergencyOffline}
      />

      <AudienceAlertBanner visible={showAudienceAlert} onClose={onClearAudienceAlert} />
    </div>
  );
}

function OpsCountdownModuleInner({
  adminEmail,
  initialConfig,
  initialSnapshot,
}: OpsCountdownModuleClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = resolveCountdownView(searchParams.get("view"));

  const roleGate = useRoleGate();
  const { stream, opsState } = useOpsStreamStateRealtime();
  const chat = useCountdownChatTroubleAlerts();
  const heroEditor = useCountdownHeroEditor({ initialConfig });

  const {
    formState,
    setField,
    saveHeroCopyForm,
    resetToLoadedState,
    isSaving,
    saveError,
    saveSuccess,
  } = heroEditor;

  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [pendingAction, setPendingAction] = useState<OpsStreamAction | "go_live_hub" | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [rehearsalMode, setRehearsalMode] = useState(true);
  const [encoderOk, setEncoderOk] = useState<boolean | null>(null);

  const [ingestCredentials, setIngestCredentials] = useState<{
    serverUrl: string;
    streamKey: string;
  } | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [phoneStreamKey, setPhoneStreamKey] = useState<string | null>(null);

  const activeStream = stream ?? snapshot.stream;
  const isLive = activeStream?.isLive === true;

  const opsStream = useMemo(
    () => toOpsStreamTelemetryView(opsState, activeStream),
    [opsState, activeStream],
  );

  const playbackUrl = useMemo(() => {
    const preview = activeStream?.cameraPreviewHlsUrl?.trim();
    if (preview) return preview;
    return resolvePreviewPlaybackUrl(activeStream);
  }, [activeStream]);

  const chatMessages = useMemo(() => mapAttendeeChatRows(chat.messages), [chat.messages]);

  const preflight = useMemo((): PreflightChecks => {
    const ingestPath =
      opsStream?.ingestStatus === "connected" ||
      activeStream?.primaryRtmpConfigured === true ||
      opsState?.pullEngineStatus === "running";

    const masterBusAudio =
      opsState != null && opsState.audioLevels.master > SILENT_METER_FLOOR;

    const countdownSchedule = Boolean(formState.showDate && formState.showTime);

    return {
      ingestPath,
      encoderConnectivity: encoderOk,
      masterBusAudio,
      countdownSchedule,
      rehearsalGate: !rehearsalMode,
    };
  }, [
    opsStream?.ingestStatus,
    activeStream?.primaryRtmpConfigured,
    opsState,
    formState.showDate,
    formState.showTime,
    encoderOk,
    rehearsalMode,
  ]);

  const goLiveBlocked =
    !preflight.ingestPath ||
    preflight.encoderConnectivity !== true ||
    !preflight.masterBusAudio ||
    !preflight.countdownSchedule ||
    !preflight.rehearsalGate;

  const showAudienceAlert =
    chat.issueType === "audio" && chat.count > 0;

  useEffect(() => {
    if (searchParams.get("view")) return;
    router.replace(buildOpsModuleHref(OPS_MODULE_ROUTES.countdown, "console"));
  }, [router, searchParams]);

  useEffect(() => {
    if (!stream) return;
    setSnapshot((current) => ({
      ...current,
      stream,
      realtime: {
        ...current.realtime,
        lastStreamStateSyncAt: stream.updatedAt,
      },
    }));
  }, [stream]);

  useEffect(() => {
    let cancelled = false;

    async function pingEncoder() {
      try {
        const response = await fetch("/api/ops/live-hub/vmix", {
          credentials: "include",
          cache: "no-store",
        });
        const data = (await response.json()) as {
          ok?: boolean;
          state?: { connectionStatus?: string };
        };
        if (!cancelled) {
          setEncoderOk(
            data.ok === true && data.state?.connectionStatus === "connected",
          );
        }
      } catch {
        if (!cancelled) setEncoderOk(false);
      }
    }

    void pingEncoder();
    const interval = window.setInterval(() => void pingEncoder(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const refreshSnapshot = useCallback(async () => {
    try {
      const response = await fetch("/api/ops/live-hub/heartbeat", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = (await response.json()) as LiveHubHeartbeatPayload;
      setSnapshot(data.opsSnapshot);
    } catch {
      // keep last snapshot
    }
  }, []);

  const runStreamAction = useCallback(
    async (action: OpsStreamAction) => {
      setPendingAction(action);
      setActionMessage(null);

      try {
        const response = await fetch("/api/ops/stream-action", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
          cache: "no-store",
        });

        const data = (await response.json()) as { success?: boolean; error?: string };
        if (!response.ok || !data.success) {
          throw new Error(data.error ?? "Stream action failed.");
        }

        setActionMessage(
          action === "switch_backup"
            ? "Backup lane is now live for attendees."
            : "Stream is offline. Attendees see the holding state.",
        );

        await refreshSnapshot();
      } catch (error) {
        setActionMessage(error instanceof Error ? error.message : "Stream action failed.");
      } finally {
        setPendingAction(null);
      }
    },
    [refreshSnapshot],
  );

  const handleConfirmGoLive = useCallback(async () => {
    if (goLiveBlocked || !roleGate.canGoLive) return;

    setPendingAction("go_live_hub");
    setActionMessage(null);

    try {
      const response = await fetch("/api/ops/live-hub/go-live", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "go_live" }),
        cache: "no-store",
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        countdownSynced?: boolean;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Go live sequence failed.");
      }

      setActionMessage(
        data.countdownSynced
          ? "Platform is live — attendee countdown synced to now."
          : "Platform is live on primary lane.",
      );
      setRehearsalMode(false);
      await refreshSnapshot();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Go live sequence failed.");
    } finally {
      setPendingAction(null);
    }
  }, [goLiveBlocked, refreshSnapshot, roleGate.canGoLive]);

  const handleSave = useCallback(() => {
    void saveHeroCopyForm();
  }, [saveHeroCopyForm]);

  const loadCameraIngest = useCallback(async () => {
    try {
      const response = await fetch("/api/ops/stream-ingest", {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = (await response.json()) as {
        serverUrl?: string | null;
        streamKey?: string | null;
        primaryRtmpIngestUrl?: string | null;
      };
      const creds =
        data.serverUrl && data.streamKey
          ? { serverUrl: data.serverUrl, streamKey: data.streamKey }
          : splitRtmpIngestUrl(data.primaryRtmpIngestUrl);
      setIngestCredentials(creds);
    } catch {
      setIngestError("Unable to load camera ingest configuration.");
    }
  }, []);

  useEffect(() => {
    if (view !== "camera") return;
    void loadCameraIngest();
  }, [view, loadCameraIngest]);

  useEffect(() => {
    if (view !== "camera") return;

    let cancelled = false;

    async function initializeMobileSession() {
      try {
        const response = await fetch("/api/ops/camera-desk/session", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operatorName: "phone_operator" }),
          cache: "no-store",
        });

        const data = (await response.json()) as {
          success?: boolean;
          streamKey?: string;
          error?: string;
        };

        if (!response.ok || !data.success || !data.streamKey) {
          throw new Error(data.error ?? "Unable to register mobile stream key.");
        }

        if (!cancelled) setPhoneStreamKey(data.streamKey);
      } catch (error) {
        console.error("Failed to register mobile console keys", error);
      }
    }

    void initializeMobileSession();
    return () => {
      cancelled = true;
    };
  }, [view]);

  const saveHostIngest = useCallback(
    async (primaryRtmpIngestUrl: string) => {
      const response = await fetch("/api/ops/stream-ingest", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryRtmpIngestUrl }),
        cache: "no-store",
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to save Host Ingest.");
      }
      await loadCameraIngest();
    },
    [loadCameraIngest],
  );

  const closeDrawer = useCallback(() => {
    router.replace(buildOpsModuleHref(OPS_MODULE_ROUTES.countdown, "console"));
  }, [router]);

  const viewTabs = COUNTDOWN_MODULE_VIEWS.map((id) => ({
    id,
    label: id,
    href: buildOpsModuleHref(OPS_MODULE_ROUTES.countdown, id),
  }));

  const canEditIngest = roleGate.role === "admin" || roleGate.role === "producer";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-brand-black text-white">
      <header className="shrink-0 border-b border-brand-border px-3 py-2 md:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="truncate font-body text-[0.65rem] text-brand-muted md:text-xs">{adminEmail}</p>
          <OpsViewTabs tabs={viewTabs} activeId={view} ariaLabel="Countdown module views" />
        </div>
      </header>

      {view === "console" ? (
        <ConsoleMasterControlCenter
          isLive={isLive}
          playbackUrl={playbackUrl}
          opsStream={opsStream}
          chatMessages={chatMessages}
          chatLoading={chat.isLoading}
          chatConnected={chat.isConnected}
          roleGate={roleGate}
          formState={formState}
          isSaving={isSaving}
          saveSuccess={saveSuccess}
          saveError={saveError}
          onFieldChange={setField}
          onSave={handleSave}
          onReset={resetToLoadedState}
          preflight={preflight}
          rehearsalMode={rehearsalMode}
          onRehearsalModeChange={setRehearsalMode}
          goLiveBlocked={goLiveBlocked}
          pendingAction={pendingAction}
          actionMessage={actionMessage}
          onGoLive={() => void handleConfirmGoLive()}
          onSwitchBackup={() => void runStreamAction("switch_backup")}
          onEmergencyOffline={() => void runStreamAction("emergency_offline")}
          showAudienceAlert={showAudienceAlert}
          onClearAudienceAlert={chat.clear}
        />
      ) : null}

      {view === "camera" ? (
        <main className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
          {ingestError ? (
            <p className="rounded-lg border border-brand-pink/40 bg-brand-pink/10 px-3 py-2 text-sm text-brand-pink">
              {ingestError}
            </p>
          ) : null}

          <HostIngestPanel
            canEdit={canEditIngest}
            initialCredentials={ingestCredentials}
            onGenerated={(payload) => {
              setIngestCredentials({
                serverUrl: payload.serverUrl,
                streamKey: payload.streamKey,
              });
            }}
            onError={setIngestError}
            onSaveIngest={saveHostIngest}
          />

          <div>
            <h2 className="mb-3 font-ui text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white">
              6-Slot Camera Matrix
            </h2>
            <CameraMatrixGrid stream={activeStream} />
          </div>

          <div>
            <h2 className="mb-3 font-ui text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white">
              Mobile Desk
            </h2>
            <CameraDeskMobileView phoneStreamKey={phoneStreamKey} />
          </div>
        </main>
      ) : null}

      <OpsDrawer open={view === "incident"} title="Incident Log" onClose={closeDrawer}>
        <OpsIncidentDrawerContent accessLogs={snapshot.accessLogs} />
      </OpsDrawer>

      <OpsDrawer open={view === "prayer"} title="Prayer Queue" onClose={closeDrawer}>
        <OpsPrayerQueueDrawerContent />
      </OpsDrawer>
    </div>
  );
}

export default function OpsCountdownModuleClient(props: OpsCountdownModuleClientProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-brand-blue" aria-hidden="true" />
        </div>
      }
    >
      <OpsCountdownModuleInner {...props} />
    </Suspense>
  );
}
