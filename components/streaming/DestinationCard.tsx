"use client";

import { memo, useState } from "react";
import DeleteConfirmDialog from "@/components/todays-service/DeleteConfirmDialog";
import TestConnectionResult from "@/components/streaming/TestConnectionResult";
import { TS } from "@/components/todays-service/ServiceUi";
import {
  deleteStreamingApi,
  disconnectStreamingApi,
  skipStreamingTodayApi,
  testStreamingDestinationApi,
  useStreamingTodayApi,
} from "@/lib/streaming/api";
import { connectionStatusLabel, formatLastChecked, liveStatusLabel } from "@/lib/streaming/labels";
import { normalizePlatform, platformMeta } from "@/lib/streaming/platforms";
import PlatformLogo from "@/components/streaming/PlatformLogo";
import {
  connectionQualityLabel,
  formatVideoProfileLabel,
  parseNetworkTest,
  parseVideoProfile,
} from "@/lib/streaming/setup";
import {
  DESTINATION_CARD_MIN_HEIGHT,
  DESTINATION_ERROR_SLOT_CLASS,
} from "@/lib/streaming/streaming-layout";
import type { StreamingTestResult } from "@/lib/streaming/types";
import type { StreamingDestination } from "@/lib/todays-service/types";

type DestinationCardProps = {
  destination: StreamingDestination;
  onReload: () => Promise<unknown>;
  onToast: (type: "success" | "error", message: string) => void;
  onSettings: (destination: StreamingDestination) => void;
  onEditSetup?: () => void;
};

function DestinationCard({
  destination,
  onReload,
  onToast,
  onSettings,
  onEditSetup,
}: DestinationCardProps) {
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<StreamingTestResult | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const platform = normalizePlatform(destination.platform);
  const meta = platformMeta(String(platform));
  const status = destination.connectionStatus;
  const liveStatus = destination.liveStatus;
  const isConnected = status === "connected" || status === "ready";
  const isReady = status === "ready";
  const isLive = liveStatus === "live" || liveStatus === "preparing";
  const videoProfile = parseVideoProfile(destination.videoProfileJson);
  const networkTest = parseNetworkTest(destination.networkTestJson);
  const displayAccount = destination.accountName ?? destination.channelName;
  const showError = Boolean(destination.lastErrorMessage && !isReady);

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testStreamingDestinationApi(destination.id);
      setTestResult(result);
      await onReload();
      onToast(result.success ? "success" : "error", result.message);
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Test failed.");
    } finally {
      setTesting(false);
    }
  };

  const connectOAuth = () => {
    window.location.href = `/api/v1/streaming/oauth/${platform}/start?destinationId=${encodeURIComponent(destination.id)}`;
  };

  return (
    <>
      <div className={`rounded-lg border border-white/8 bg-black/60 p-3 ${DESTINATION_CARD_MIN_HEIGHT}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-3">
            <PlatformLogo platform={String(platform)} className="h-9 w-9 shrink-0 text-xs" />
            <div className="min-w-0">
              <p className="font-body text-sm font-semibold text-white">{meta?.label ?? destination.destinationName}</p>
              <p className="min-h-[1.125rem] font-body text-xs text-white/60">{displayAccount ?? "\u00a0"}</p>
              <p className="mt-1 min-h-[1rem] font-body text-xs text-white/50">
                {isReady
                  ? `${formatVideoProfileLabel(videoProfile)} · ${videoProfile.bitrateKbps} kbps${
                      destination.connectionQuality || networkTest
                        ? ` · ${connectionQualityLabel(destination.connectionQuality ?? networkTest?.streamingQuality ?? null)}`
                        : ""
                    }`
                  : "\u00a0"}
              </p>
            </div>
          </div>
          <div className="flex min-h-[2.5rem] flex-col items-end justify-center gap-1">
            <span
              className={`font-ui text-[0.52rem] font-bold uppercase ${
                isLive ? "text-[#53fc18]" : isReady ? "text-[#53fc18]" : isConnected ? "text-brand-blue" : "text-white/45"
              }`}
            >
              {isReady ? "Ready to Stream" : liveStatus !== "offline" ? liveStatusLabel(liveStatus) : connectionStatusLabel(status)}
            </span>
          </div>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-2 font-body text-xs text-white/55">
          <div>
            <dt>Last checked</dt>
            <dd className="text-white/75">{formatLastChecked(destination.lastCheckedAt)}</dd>
          </div>
          <div>
            <dt>Today&apos;s service</dt>
            <dd className="text-white/75">{destination.selectedForToday ? "Use Today" : "Do Not Use Today"}</dd>
          </div>
        </dl>

        <div className={DESTINATION_ERROR_SLOT_CLASS}>
          {showError ? (
            <p className="mt-2 font-body text-xs text-amber-200/90">{destination.lastErrorMessage}</p>
          ) : null}
        </div>

        <TestConnectionResult running={testing} result={testResult} />

        <div className="mt-3 flex min-h-[2.75rem] flex-wrap content-start gap-2">
          {status === "not_connected" && meta?.oauth ? (
            <button type="button" disabled={busy} onClick={connectOAuth} className={TS.btnPrimary}>
              Connect
            </button>
          ) : null}
          {isConnected ? (
            <>
              <button type="button" disabled={busy} onClick={() => void runTest()} className={TS.btnBlue}>
                Test Connection
              </button>
              {destination.selectedForToday ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await skipStreamingTodayApi(destination.id);
                      await onReload();
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className={TS.btnOutline}
                >
                  Do Not Use Today
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await useStreamingTodayApi(destination.id);
                      await onReload();
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className={TS.btnOutline}
                >
                  Use Today
                </button>
              )}
              <button type="button" disabled={busy} onClick={() => onSettings(destination)} className={TS.btnOutline}>
                Settings
              </button>
              {onEditSetup ? (
                <button type="button" disabled={busy} onClick={onEditSetup} className={TS.btnOutline}>
                  Edit Setup
                </button>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await disconnectStreamingApi(destination.id);
                    await onReload();
                    onToast("success", "Disconnected.");
                  } catch (err) {
                    onToast("error", err instanceof Error ? err.message : "Disconnect failed.");
                  } finally {
                    setBusy(false);
                  }
                }}
                className={TS.btnOutline}
              >
                Disconnect
              </button>
              {meta?.oauth ? (
                <button type="button" disabled={busy} onClick={connectOAuth} className={TS.btnOutline}>
                  Change Account
                </button>
              ) : null}
            </>
          ) : null}
          {!meta?.oauth && status === "not_connected" ? (
            <button type="button" disabled={busy} onClick={() => onSettings(destination)} className={TS.btnPrimary}>
              Set Up
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy || isLive}
            onClick={() => setDeleteOpen(true)}
            className={TS.btnOutline}
          >
            Delete
          </button>
        </div>
      </div>

      <DeleteConfirmDialog
        open={deleteOpen}
        title="Delete streaming destination?"
        message={`Remove ${destination.destinationName}? This cannot be undone.`}
        confirmLabel="Delete"
        confirming={busy}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setBusy(true);
          try {
            await deleteStreamingApi(destination.id);
            await onReload();
            onToast("success", "Destination deleted.");
            setDeleteOpen(false);
          } catch (err) {
            onToast("error", err instanceof Error ? err.message : "Delete failed.");
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}

export default memo(DestinationCard);
