"use client";

import type { OpsSnapshot, OpsStreamAction } from "@/lib/ops/types";

type StreamUiState = "offline" | "live" | "backup";

type StreamControlPanelProps = {
  snapshot: OpsSnapshot;
  operatorEmail: string;
  pendingAction: OpsStreamAction | null;
  actionMessage: string | null;
  onStreamAction: (action: OpsStreamAction) => void;
};

function resolveStreamUiState(stream: OpsSnapshot["stream"]): StreamUiState {
  if (!stream.isLive || stream.activeSource === "offline") return "offline";
  if (stream.activeSource === "backup") return "backup";
  return "live";
}

function resolveSafetyStatus(stream: OpsSnapshot["stream"]): {
  ok: boolean;
  title: string;
  detail: string;
  footnote: string;
} {
  const primaryReady =
    stream.primaryConfigured ||
    stream.cameraPreviewConfigured ||
    stream.primaryRtmpPullConfigured;
  const backupReady = stream.backupConfigured || stream.backupRtmpPullConfigured;

  if (!primaryReady) {
    return {
      ok: false,
      title: "Setup Needed",
      detail: "Primary video path is not configured yet.",
      footnote: "Open Camera ingest or Broadcast Desk before going live.",
    };
  }

  if (!backupReady) {
    return {
      ok: true,
      title: "Primary Path Ready",
      detail: "Main stream looks configured. Backup lane is optional.",
      footnote: "Ready for show execution.",
    };
  }

  return {
    ok: true,
    title: "All Lanes Stable",
    detail: "No stream blockers found.",
    footnote: "Ready for show execution.",
  };
}

function streamStatusBadgeClass(state: StreamUiState): string {
  switch (state) {
    case "live":
      return "bg-brand-pink/10 text-brand-pink";
    case "backup":
      return "bg-brand-purple/10 text-brand-purple";
    default:
      return "bg-brand-black text-brand-muted";
  }
}

export default function StreamControlPanel({
  snapshot,
  operatorEmail,
  pendingAction,
  actionMessage,
  onStreamAction,
}: StreamControlPanelProps) {
  const streamState = resolveStreamUiState(snapshot.stream);
  const safety = resolveSafetyStatus(snapshot.stream);

  return (
    <section className="glass-panel rounded-2xl border border-brand-border p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-ui text-xs font-semibold uppercase tracking-wider text-brand-muted">
            Stream Master Control
          </h2>
          <p className="font-ui text-[11px] text-brand-muted">
            Go live · backup · emergency offline for all attendees
          </p>
        </div>
        <span className="rounded-md border border-brand-border bg-brand-black px-3 py-1 font-ui text-[10px] text-brand-muted">
          {operatorEmail}
        </span>
      </div>

      {actionMessage ? (
        <p
          className={`mb-4 rounded-lg border px-3 py-2 font-ui text-xs ${
            /failed|forbidden|invalid|required|error|not configured/i.test(actionMessage)
              ? "border-brand-pink/40 bg-brand-pink/10 text-brand-pink"
              : "border-brand-blue/30 bg-brand-blue/10 text-white"
          }`}
          role="status"
        >
          {actionMessage}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-border bg-brand-black p-2.5 font-ui text-xs">
            <span className="text-brand-muted">Active Output Track:</span>
            <span
              className={`rounded px-2 py-0.5 font-bold uppercase tracking-wide ${streamStatusBadgeClass(streamState)}`}
            >
              {streamState}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => onStreamAction("go_live")}
              disabled={pendingAction != null}
              className="touch-target rounded-lg bg-brand-pink py-2.5 font-ui text-xs font-semibold tracking-wide disabled:opacity-60"
            >
              {pendingAction === "go_live" ? "Working…" : "Go Live"}
            </button>
            <button
              type="button"
              onClick={() => onStreamAction("switch_backup")}
              disabled={pendingAction != null}
              className="touch-target rounded-lg bg-brand-purple py-2.5 font-ui text-xs font-semibold tracking-wide disabled:opacity-60"
            >
              {pendingAction === "switch_backup" ? "Working…" : "Use Backup"}
            </button>
            <button
              type="button"
              onClick={() => onStreamAction("emergency_offline")}
              disabled={pendingAction != null}
              className="touch-target rounded-lg border border-brand-pink/50 bg-brand-pink/15 py-2.5 font-ui text-xs font-semibold tracking-wide text-brand-pink disabled:opacity-60"
            >
              {pendingAction === "emergency_offline" ? "Working…" : "Go Offline"}
            </button>
          </div>
        </div>

        <div
          className={`flex flex-col justify-between rounded-lg border p-3 ${
            safety.ok
              ? "border-brand-blue/20 bg-brand-blue/5"
              : "border-brand-pink/20 bg-brand-pink/5"
          }`}
        >
          <div>
            <p
              className={`font-ui text-xs font-semibold ${safety.ok ? "text-brand-blue" : "text-brand-pink"}`}
            >
              {safety.title}
            </p>
            <p className="mt-1 font-ui text-[10px] text-brand-muted">{safety.detail}</p>
          </div>
          <p className="mt-2 font-ui text-[10px] italic text-brand-muted">{safety.footnote}</p>
        </div>
      </div>
    </section>
  );
}
