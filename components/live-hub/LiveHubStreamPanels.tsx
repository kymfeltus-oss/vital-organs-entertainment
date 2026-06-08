"use client";

import type { ReactNode } from "react";
import { RESTREAM_DASHBOARD_URL } from "@/lib/live-hub/restream/client";
import type { RestreamState } from "@/lib/live-hub/restream/types";
import { VMIX_OPERATOR_GUIDANCE } from "@/lib/live-hub/readiness";
import type { VmixCommandType, VmixState } from "@/lib/live-hub/vmix/types";
import { formatPlaybackLaneLabel } from "@/lib/live/hls";
import type { OpsSnapshot } from "@/lib/ops/types";
import type { ChecklistPhase } from "@/lib/live-hub/types";

type LiveHubStreamPanelsProps = {
  section: "stream-setup" | "content" | "team" | "advanced";
  snapshot: OpsSnapshot;
  vmixState: VmixState | null;
  vmixError: string | null;
  restreamState: RestreamState | null;
  restreamError: string | null;
  pendingVmixAction: VmixCommandType | null;
  checklistPhases: ChecklistPhase[];
  onVmixAction: (
    type: VmixCommandType,
    options?: { confirmed?: boolean; readinessReviewed?: boolean },
  ) => void;
  onRestreamRefresh: () => void;
  onRestreamSyncMetadata: () => void;
};

function PanelShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#111111]/95 p-4">
      <h3 className="text-[0.58rem] font-bold uppercase tracking-[0.22em] text-zinc-400">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function LiveHubStreamPanels({
  section,
  snapshot,
  vmixState,
  vmixError,
  restreamState,
  restreamError,
  pendingVmixAction,
  checklistPhases,
  onVmixAction,
  onRestreamRefresh,
  onRestreamSyncMetadata,
}: LiveHubStreamPanelsProps) {
  if (section === "content" || section === "team" || section === "advanced") {
    const copy =
      section === "content"
        ? "Manage lower thirds, bumper reels, and worship assets from this panel in a future release."
        : section === "team"
          ? "Assign TD, audio, chat moderation, and prayer team roles here in a future release."
          : "Recording enforcement, Restream blocking, and telemetry thresholds will be configurable here.";

    return (
      <PanelShell
        title={
          section === "content"
            ? "Content & Media"
            : section === "team"
              ? "Team & Roles"
              : "Advanced Settings"
        }
      >
        <p className="text-sm text-zinc-400">{copy}</p>
      </PanelShell>
    );
  }

  const finalReviewComplete = checklistPhases.find((phase) => phase.id === "final_review")?.complete;

  return (
    <div className="space-y-4">
      <PanelShell title="Stream Setup">
        <dl className="grid grid-cols-2 gap-3 text-xs text-zinc-400">
          <div>
            <dt>Platform Live</dt>
            <dd className="font-mono text-zinc-200">
              {snapshot.stream.isLive ? "LIVE" : "OFFLINE"}
            </dd>
          </div>
          <div>
            <dt>Active Source</dt>
            <dd className="font-mono text-zinc-200">{snapshot.stream.activeSource}</dd>
          </div>
          <div>
            <dt>Primary Lane</dt>
            <dd className="font-mono text-zinc-200">
              {formatPlaybackLaneLabel(
                snapshot.stream.primaryPlaybackUrlStatus,
                snapshot.stream.primaryConfigured,
              )}
            </dd>
          </div>
          <div>
            <dt>Backup Lane</dt>
            <dd className="font-mono text-zinc-200">
              {formatPlaybackLaneLabel(
                snapshot.stream.backupPlaybackUrlStatus,
                snapshot.stream.backupConfigured,
              )}
            </dd>
          </div>
        </dl>
      </PanelShell>

      <PanelShell title="vMix Control">
        {vmixError ? (
          <p className="mb-3 rounded-lg border border-[#B0267A]/40 bg-[#B0267A]/10 px-3 py-2 text-xs text-[#f5c2e0]">
            {vmixError}
          </p>
        ) : null}
        {vmixState &&
        (vmixState.connectionStatus === "disconnected" ||
          vmixState.connectionStatus === "unreachable" ||
          vmixState.connectionStatus === "stale") ? (
          <p className="mb-3 rounded-lg border border-[#1E40AF]/35 bg-[#1E40AF]/10 px-3 py-2 text-xs text-zinc-300">
            {VMIX_OPERATOR_GUIDANCE}
          </p>
        ) : null}
        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-zinc-500">Connection</dt>
            <dd className="font-mono text-zinc-200">{vmixState?.connectionStatus ?? "unknown"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Program</dt>
            <dd className="font-mono text-zinc-200">{vmixState?.activeInput ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Recording</dt>
            <dd className="font-mono text-zinc-200">{vmixState?.isRecording ? "On" : "Off"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Streaming</dt>
            <dd className="font-mono text-zinc-200">{vmixState?.isStreaming ? "On" : "Off"}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["cut", "Cut"],
              ["fade", "Fade"],
              ["start_recording", "Start Recording"],
              ["stop_recording", "Stop Recording"],
              ["start_streaming", "Start Streaming"],
              ["stop_streaming", "Stop Streaming"],
              ["refresh_state", "Refresh vMix"],
            ] as const
          ).map(([type, label]) => (
            <button
              key={type}
              type="button"
              disabled={pendingVmixAction !== null}
              onClick={() =>
                onVmixAction(type, {
                  readinessReviewed:
                    type === "start_streaming" ? Boolean(finalReviewComplete) : false,
                })
              }
              className="rounded-full border border-white/15 px-3 py-2 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-zinc-300 transition hover:border-[#1E40AF]/50 hover:text-white disabled:opacity-50"
            >
              {pendingVmixAction === type ? "..." : label}
            </button>
          ))}
        </div>
      </PanelShell>

      <PanelShell title="Restream Control">
        {restreamError ? (
          <p className="mb-3 rounded-lg border border-[#B0267A]/40 bg-[#B0267A]/10 px-3 py-2 text-xs text-[#f5c2e0]">
            {restreamError}
          </p>
        ) : null}
        <dl className="space-y-2 text-xs text-zinc-400">
          <div className="flex justify-between gap-3">
            <dt>Connection</dt>
            <dd className="font-mono text-zinc-200">
              {restreamState?.connectionStatus ?? "unknown"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Stream Status</dt>
            <dd className="font-mono text-zinc-200">
              {restreamState?.streamStatus ?? "—"}
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRestreamRefresh}
            className="rounded-full border border-white/15 px-3 py-2 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-zinc-300 transition hover:border-[#1E40AF]/50"
          >
            Refresh Restream
          </button>
          <a
            href={RESTREAM_DASHBOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/15 px-3 py-2 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-zinc-300 transition hover:border-[#B0267A]/50"
          >
            Restream Dashboard
          </a>
          <button
            type="button"
            onClick={onRestreamSyncMetadata}
            className="rounded-full border border-white/15 px-3 py-2 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-zinc-300 transition hover:border-[#1E40AF]/50"
          >
            Sync Metadata
          </button>
        </div>
      </PanelShell>
    </div>
  );
}
