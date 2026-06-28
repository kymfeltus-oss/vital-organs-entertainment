"use client";

import { useCallback, useState } from "react";
import type { OwnerBroadcastSnapshot, OwnerPublisherSession } from "@/lib/owner/contracts";
import type { SelectedCaptureDevices } from "@/components/owner/InAppDeviceCaptureSelectors";
import ExternalIngestCredentialsPanel from "@/components/owner/ExternalIngestCredentialsPanel";
import InAppDeviceCaptureSelectors from "@/components/owner/InAppDeviceCaptureSelectors";
import OwnerCameraPublisher from "@/components/owner/OwnerCameraPublisher";
import OwnerSnapshotTimestamp from "@/components/owner/OwnerSnapshotTimestamp";

const DROP_CURTAIN_SUCCESS_BANNER =
  "🟢 SUCCESS: Drop-Curtain override successfully broadcast to all connected devices.";

function DropCurtainSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

type BroadcastControlWizardProps = {
  snapshot: OwnerBroadcastSnapshot;
  loading?: boolean;
  error?: string | null;
  actionMessage?: string | null;
  actionPending?: boolean;
  hasPendingTasks?: boolean;
  ingestCredentials?: {
    rtmpUrl: string | null;
    streamKey: string | null;
    detail: string | null;
    loading: boolean;
  };
  publisherSession?: OwnerPublisherSession | null;
  selectedDevices?: SelectedCaptureDevices;
  onDevicesChange?: (devices: SelectedCaptureDevices) => void;
  onStartExternalBroadcast?: () => void;
  onLaunchInAppCamera?: () => void;
  onDropCurtain?: () => void | Promise<boolean>;
  onEndBroadcast?: () => void;
  onRefresh?: () => void;
};

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2">
      <p className="font-ui text-[0.55rem] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-ui text-xs font-bold uppercase tracking-[0.1em] text-slate-100">
        {value.replace(/_/g, " ")}
      </p>
    </div>
  );
}

export default function BroadcastControlWizard({
  snapshot,
  loading = false,
  error = null,
  actionMessage = null,
  actionPending = false,
  hasPendingTasks = false,
  ingestCredentials = { rtmpUrl: null, streamKey: null, detail: null, loading: true },
  publisherSession = null,
  selectedDevices,
  onDevicesChange,
  onStartExternalBroadcast = () => {},
  onLaunchInAppCamera = () => {},
  onDropCurtain = () => {},
  onEndBroadcast = () => {},
  onRefresh = () => {},
}: BroadcastControlWizardProps) {
  const [isOverriding, setIsOverriding] = useState(false);
  const [dropCurtainSuccessVisible, setDropCurtainSuccessVisible] = useState(false);

  const isLive =
    snapshot.playback.status === "live" ||
    snapshot.playback.status === "playback_pending" ||
    snapshot.publish.status === "publishing";

  const handleDropCurtainClick = useCallback(() => {
    setIsOverriding(true);
    setDropCurtainSuccessVisible(false);

    void (async () => {
      try {
        const result = await onDropCurtain();
        const succeeded = result === true;

        if (succeeded) {
          setDropCurtainSuccessVisible(true);
        }
      } finally {
        setIsOverriding(false);
      }
    })();
  }, [onDropCurtain]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 p-4 md:max-w-6xl sm:p-6">
      {dropCurtainSuccessVisible ? (
        <div
          role="status"
          className="w-full rounded-xl border-2 border-emerald-400/60 bg-emerald-500/15 px-4 py-4 font-body text-sm font-semibold text-emerald-100 shadow-[0_0_24px_rgba(52,211,153,0.25)]"
        >
          {DROP_CURTAIN_SUCCESS_BANNER}
        </div>
      ) : null}

      <section
        className={`pointer-events-auto w-full rounded-2xl border-2 bg-gradient-to-b p-4 transition-shadow duration-300 sm:p-5 ${
          isOverriding
            ? "animate-pulse border-emerald-400/80 from-emerald-950/30 to-slate-950 shadow-[0_0_32px_rgba(52,211,153,0.45)]"
            : "border-red-600/80 from-red-950/40 to-slate-950 shadow-none"
        }`}
      >
        <p
          className={`font-ui text-[0.62rem] font-bold uppercase tracking-[0.24em] ${
            isOverriding ? "text-emerald-300" : "text-red-400"
          }`}
        >
          🚨 Extreme Master Broadcast Override System
        </p>
        <p className="mt-2 font-body text-xs text-red-200/70">
          Bypasses schedule registries — sets imminent live and notifies all attendee clients instantly.
          Does not modify countdown configuration.
        </p>
        <button
          type="button"
          disabled={isOverriding}
          data-action="drop-curtain"
          aria-busy={isOverriding}
          onClick={handleDropCurtainClick}
          className={`relative z-10 mt-4 flex min-h-16 w-full items-center justify-center gap-3 rounded-xl border-2 px-4 font-ui text-[0.72rem] font-bold uppercase tracking-[0.1em] transition-colors disabled:cursor-not-allowed sm:text-[0.78rem] sm:tracking-[0.12em] ${
            isOverriding
              ? "border-emerald-400/70 bg-emerald-600/20 text-emerald-100 shadow-[0_0_24px_rgba(52,211,153,0.35)]"
              : "border-red-500 bg-red-600/20 text-red-100 shadow-[0_0_24px_rgba(220,38,38,0.25)] hover:bg-red-600/35 disabled:opacity-40"
          }`}
        >
          {isOverriding ? (
            <>
              <DropCurtainSpinner className="h-5 w-5 shrink-0 animate-spin text-emerald-300" />
              <span className="text-left leading-snug">
                🚨 TRANSMISSION ENGAGED: SYNCHRONIZING ATTENDEE SCREENS (10s)...
              </span>
            </>
          ) : (
            "⚡ Drop Curtain: Bypass All Calendars & Transmit Live Right Now"
          )}
        </button>
      </section>

      <header className="border-b border-slate-800 pb-4">
        <p className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-sky-400">
          Broadcast Control
        </p>
        <h1 className="font-headline text-2xl uppercase tracking-[0.08em] text-slate-50">
          Master Setup Wizard
        </h1>
        <p className="mt-2 font-body text-sm text-slate-400">
          Choose an ingest path, resolve setup tasks, then activate the live broadcast gate.
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 font-body text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {hasPendingTasks ? (
        <div
          role="alert"
          className="w-full rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-4 font-body text-sm text-amber-100"
        >
          [⚠️ PENDING TASKS: You have unresolved setup requirements. Review your Pre-Show checklist
          before going live]
        </div>
      ) : null}

      {actionMessage ? (
        <div className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 font-body text-sm text-slate-200">
          {actionMessage}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <StatusPill label="Event phase" value={snapshot.eventPhase.phase} />
        <StatusPill label="Publish" value={snapshot.publish.status} />
        <StatusPill label="Playback" value={snapshot.playback.status} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.16em] text-slate-300">
            Option 1: Broadcast via External App
          </h2>
          <p className="mt-2 font-body text-xs text-slate-500">vMix / OBS / Larix → Restream RTMP</p>

          <div className="mt-5 flex-1">
            <ExternalIngestCredentialsPanel
              rtmpUrl={ingestCredentials.rtmpUrl}
              streamKey={ingestCredentials.streamKey}
              detail={ingestCredentials.detail}
              loading={ingestCredentials.loading}
            />
          </div>

          <button
            type="button"
            disabled={actionPending || isLive}
            onClick={onStartExternalBroadcast}
            className="mt-6 min-h-14 w-full rounded-xl bg-sky-500 px-4 font-ui text-[0.72rem] font-bold uppercase tracking-[0.12em] text-slate-950 disabled:opacity-40"
          >
            [🚀 START MAIN EXTERNAL BROADCAST]
          </button>
        </article>

        <article className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.16em] text-slate-300">
            Option 2: Broadcast via This Device&apos;s Camera
          </h2>
          <p className="mt-2 font-body text-xs text-slate-500">
            WebRTC break-glass path — uses selected device hardware
          </p>

          <div className="mt-5 flex-1">
            <InAppDeviceCaptureSelectors
              disabled={actionPending || isLive}
              onSelectionChange={onDevicesChange}
            />
          </div>

          <button
            type="button"
            disabled={actionPending || isLive}
            onClick={onLaunchInAppCamera}
            className="mt-6 min-h-14 w-full rounded-xl border border-slate-600 bg-slate-800 px-4 font-ui text-[0.72rem] font-bold uppercase tracking-[0.12em] text-slate-100 disabled:opacity-40"
          >
            [📱 LAUNCH IN-APP DEVICE CAMERA STREAM]
          </button>
        </article>
      </section>

      {publisherSession ? (
        <>
          <section className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-4 lg:hidden">
            <p className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] text-sky-400">
              Direct camera publisher
            </p>
            <p className="mt-2 font-body text-sm text-slate-300">
              Session active — video preview hidden on mobile to reduce CPU load.
            </p>
            <p className="mt-1 font-body text-xs text-slate-500">
              Channel: {publisherSession.channel}
            </p>
          </section>
          <section className="hidden rounded-2xl border border-slate-800 bg-slate-900/30 p-4 lg:block">
            <OwnerCameraPublisher
              embedded
              liveChannel={publisherSession.channel}
              browserChannel={publisherSession.browserChannel}
              sessionId={publisherSession.sessionId}
              videoDeviceId={selectedDevices?.videoDeviceId}
              audioDeviceId={selectedDevices?.audioDeviceId}
              autoStart
            />
          </section>
        </>
      ) : null}

      <section className="flex w-full flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={actionPending}
          onClick={onRefresh}
          className="min-h-11 w-full rounded-full border border-slate-700 px-5 font-ui text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-200 disabled:opacity-50 sm:w-auto"
        >
          {loading ? "Refreshing…" : "Refresh status"}
        </button>
        <button
          type="button"
          disabled={actionPending || !isLive}
          onClick={onEndBroadcast}
          className="min-h-11 w-full rounded-full border border-red-400/40 px-5 font-ui text-[0.68rem] font-bold uppercase tracking-[0.14em] text-red-300 disabled:opacity-50 sm:w-auto"
        >
          End broadcast
        </button>
      </section>

      <footer className="font-body text-xs text-slate-500">
        <OwnerSnapshotTimestamp capturedAt={snapshot.capturedAt} />
      </footer>
    </div>
  );
}
