"use client";

import { useCallback, useRef, useState } from "react";
import GoLiveMasterOverrideDialog, {
  type GoLiveFeedback,
} from "@/components/owner/GoLiveMasterOverrideDialog";
import {
  postOwnerBroadcastEnd,
  postOwnerMasterGoLive,
  postOwnerPreflight,
} from "@/lib/enterprise/liv-golf/liv-owner-broadcast-client";
import {
  canAttemptLivGoLive,
  formatLivReadinessError,
} from "@/lib/enterprise/liv-golf/check-stream-readiness";
import type { LivStreamSetupStatus } from "@/lib/enterprise/liv-golf/liv-stream-setup-status";
import type { OwnerBroadcastSnapshot, PreflightCheck, PreflightCheckStatus } from "@/lib/owner/contracts";

export type LivBroadcastAction = "idle" | "go-live" | "stop";

export type LivGoLiveControlsProps = {
  isLoading: boolean;
  isLive: boolean;
  canAttemptGoLive: boolean;
  preflight: PreflightCheck[];
  hlsUrl: string | null;
  publishStatus: string | undefined;
  eventPhase: string | undefined;
  scheduledAirTimeLabel: string | null;
  streamReadiness: LivStreamSetupStatus | null;
  onSnapshotUpdate: (snapshot: OwnerBroadcastSnapshot) => void;
  onPipelineRefresh: () => Promise<void>;
  onActionSuccess?: (message: string) => void;
};

function preflightTone(status: PreflightCheckStatus): string {
  if (status === "pass") return "text-emerald-400";
  if (status === "warn") return "text-amber-300";
  if (status === "fail") return "text-red-300";
  return "text-zinc-500";
}

function publishLabel(status: string | undefined, isLive: boolean): string {
  if (isLive) return "LIVE ON PLATFORM";
  if (status === "starting" || status === "preflight") return "INITIALIZING";
  if (status === "error") return "ERROR";
  return "STANDBY";
}

export default function LivGoLiveControls({
  isLoading,
  isLive,
  canAttemptGoLive,
  preflight,
  hlsUrl,
  publishStatus,
  eventPhase,
  scheduledAirTimeLabel,
  streamReadiness,
  onSnapshotUpdate,
  onPipelineRefresh,
  onActionSuccess,
}: LivGoLiveControlsProps) {
  const [goLiveDialogOpen, setGoLiveDialogOpen] = useState(false);
  const [goLiveFeedback, setGoLiveFeedback] = useState<GoLiveFeedback | null>(null);
  const [systemWarning, setSystemWarning] = useState<string | null>(null);
  const [broadcastAction, setBroadcastAction] = useState<LivBroadcastAction>("idle");
  const [preflightRunning, setPreflightRunning] = useState(false);
  const [localPreflight, setLocalPreflight] = useState<PreflightCheck[]>(preflight);

  const goLiveInFlightRef = useRef(false);
  const stopInFlightRef = useRef(false);

  const checklist = localPreflight.length > 0 ? localPreflight : preflight;
  const isBusy = preflightRunning || broadcastAction !== "idle";

  const preflightBlocked = checklist.some((check) => check.status === "fail");
  const preflightPassed =
    checklist.length > 0 &&
    !preflightBlocked &&
    !checklist.some((check) => check.status === "warn");

  const handleRunPreflight = useCallback(async () => {
    if (isBusy || isLoading) return;

    setPreflightRunning(true);
    setSystemWarning(null);

    try {
      const result = await postOwnerPreflight("external_hls");

      if (!result.ok) {
        throw new Error(result.error ?? "Preflight request failed.");
      }

      if (result.snapshot) {
        onSnapshotUpdate(result.snapshot);
        setLocalPreflight(result.snapshot.preflight);
      }

      await onPipelineRefresh();

      const message = result.blocked
        ? "Preflight found blocking issues — resolve before master go-live."
        : "Preflight complete — ready for master go-live.";
      onActionSuccess?.(message);
    } catch (preflightError) {
      const message =
        preflightError instanceof Error ? preflightError.message : "Preflight request failed.";
      console.error("[LivGoLiveControls] preflight failed:", message);
      setSystemWarning(`Preflight failed: ${message}`);
    } finally {
      setPreflightRunning(false);
    }
  }, [isBusy, isLoading, onActionSuccess, onPipelineRefresh, onSnapshotUpdate]);

  const handleOpenGoLive = useCallback(() => {
    if (isBusy || isLoading || !canAttemptGoLive) return;
    setGoLiveFeedback(null);
    setSystemWarning(null);
    setGoLiveDialogOpen(true);
  }, [canAttemptGoLive, isBusy, isLoading]);

  const handleConfirmGoLive = useCallback(async () => {
    if (goLiveInFlightRef.current || broadcastAction !== "idle") return;

    goLiveInFlightRef.current = true;
    setBroadcastAction("go-live");
    setSystemWarning(null);

    try {
      if (streamReadiness && !canAttemptLivGoLive(streamReadiness)) {
        throw new Error(`Stream cannot launch: ${formatLivReadinessError(streamReadiness)}`);
      }

      const result = await postOwnerMasterGoLive();

      if (!result.ok) {
        throw new Error(result.error ?? "Master go-live request failed.");
      }

      if (result.snapshot) {
        onSnapshotUpdate(result.snapshot);
        setLocalPreflight(result.snapshot.preflight);
      }

      await onPipelineRefresh();

      setGoLiveFeedback({
        kind: "success",
        message: result.message ?? "Master go-live confirmed. Fans receive HLS on /enterprise/liv-golf/live.",
      });
      onActionSuccess?.(result.message ?? "Stream is live on platform.");
    } catch (goLiveError) {
      const message =
        goLiveError instanceof Error ? goLiveError.message : "Master go-live request failed.";
      console.error("[LivGoLiveControls] master go-live failed:", message);
      setSystemWarning(`Master go-live failed: ${message}`);
      setGoLiveFeedback({
        kind: "error",
        message,
      });
    } finally {
      goLiveInFlightRef.current = false;
      setBroadcastAction("idle");
    }
  }, [
    broadcastAction,
    onActionSuccess,
    onPipelineRefresh,
    onSnapshotUpdate,
    streamReadiness,
  ]);

  const handleStopStream = useCallback(async () => {
    if (stopInFlightRef.current || broadcastAction !== "idle") return;
    if (publishStatus !== "publishing" && !isLive) return;

    stopInFlightRef.current = true;
    setBroadcastAction("stop");
    setSystemWarning(null);

    try {
      const result = await postOwnerBroadcastEnd();

      if (!result.ok) {
        throw new Error(result.error ?? "End broadcast request failed.");
      }

      if (result.snapshot) {
        onSnapshotUpdate(result.snapshot);
        setLocalPreflight(result.snapshot.preflight);
      }

      await onPipelineRefresh();
      onActionSuccess?.(result.message ?? "Broadcast ended.");
    } catch (stopError) {
      const message =
        stopError instanceof Error ? stopError.message : "End broadcast request failed.";
      console.error("[LivGoLiveControls] broadcast-end failed:", message);
      setSystemWarning(`End broadcast failed: ${message}`);
    } finally {
      stopInFlightRef.current = false;
      setBroadcastAction("idle");
    }
  }, [broadcastAction, isLive, onActionSuccess, onPipelineRefresh, onSnapshotUpdate, publishStatus]);

  const handleDismissFeedback = useCallback(() => {
    setGoLiveFeedback(null);
    setGoLiveDialogOpen(false);
  }, []);

  return (
    <>
      <div className="rounded-xl border border-white/10 bg-black/40 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#CCFF00]">
          Go-Live Controls
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Realtime sync via stream-state-sync · row id current_event · air time from
          event_countdown_config.start_time
        </p>

        {systemWarning ? (
          <p
            role="alert"
            data-testid="liv-system-warning"
            className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200"
          >
            {systemWarning}
          </p>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-xs sm:grid-cols-3">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-zinc-500">
              Platform
            </span>
            <span
              className={`text-sm font-bold ${isLive ? "text-[#CCFF00]" : "text-zinc-400"}`}
            >
              {publishLabel(publishStatus, isLive)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-zinc-500">Phase</span>
            <span className="text-sm font-bold uppercase text-white">{eventPhase ?? "idle"}</span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="block text-[10px] uppercase tracking-wider text-zinc-500">
              Preflight
            </span>
            <span
              className={`text-sm font-bold ${
                checklist.length === 0
                  ? "text-zinc-500"
                  : preflightBlocked
                    ? "text-red-300"
                    : preflightPassed
                      ? "text-emerald-400"
                      : "text-amber-300"
              }`}
            >
              {checklist.length === 0
                ? "NOT RUN"
                : preflightBlocked
                  ? "BLOCKED"
                  : preflightPassed
                    ? "PASS"
                    : "WARN"}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            data-testid="liv-run-preflight"
            disabled={isBusy || isLoading}
            onClick={() => void handleRunPreflight()}
            className="rounded-lg border border-white/15 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:border-[#CCFF00]/40 disabled:opacity-50"
          >
            {preflightRunning ? "Running Preflight..." : "Run Preflight"}
          </button>

          {!isLive ? (
            <button
              type="button"
              data-testid="liv-master-go-live"
              disabled={isBusy || isLoading || !canAttemptGoLive}
              onClick={handleOpenGoLive}
              className="rounded-lg bg-[#CCFF00] px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-black transition hover:bg-[#b8e600] disabled:opacity-50"
            >
              {broadcastAction === "go-live" ? "Going Live..." : "Master Go-Live"}
            </button>
          ) : (
            <button
              type="button"
              data-testid="liv-stop-broadcast"
              disabled={isBusy || isLoading}
              onClick={() => void handleStopStream()}
              className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              {broadcastAction === "stop" ? "Stopping..." : "End Broadcast / Stop Stream"}
            </button>
          )}
        </div>

        {checklist.length > 0 ? (
          <ul className="mt-4 space-y-2" data-testid="liv-preflight-checklist">
            {checklist.map((check) => (
              <li
                key={check.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-white/5 bg-[#1a1a1a]/60 px-3 py-2"
              >
                <div>
                  <p className="text-sm text-white">{check.label}</p>
                  {check.detail ? (
                    <p className="mt-0.5 text-xs text-zinc-500">{check.detail}</p>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 font-mono text-[10px] font-bold uppercase ${preflightTone(check.status)}`}
                >
                  {check.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-xs text-zinc-500">
            Run preflight to verify live_stream_state (current_event), event_countdown_config.start_time,
            and IVS/HLS ingest keys.
          </p>
        )}

        {hlsUrl ? (
          <p className="mt-4 break-all font-mono text-[10px] text-zinc-500">HLS: {hlsUrl}</p>
        ) : null}
      </div>

      <GoLiveMasterOverrideDialog
        open={goLiveDialogOpen}
        isConfirming={broadcastAction === "go-live"}
        scheduledLabel={scheduledAirTimeLabel ?? "Target air time not set"}
        feedback={goLiveFeedback}
        onCancel={() => {
          if (broadcastAction === "go-live") return;
          setGoLiveDialogOpen(false);
          setGoLiveFeedback(null);
        }}
        onConfirm={() => void handleConfirmGoLive()}
        onDismissFeedback={handleDismissFeedback}
      />
    </>
  );
}
