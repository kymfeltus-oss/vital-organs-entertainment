"use client";

import Link from "next/link";
import { isLivStreamLiveStatus } from "@/lib/enterprise/liv-golf/liv-stream-status-patches";
import type { LivStreamSetupStatus } from "@/lib/enterprise/liv-golf/liv-stream-setup-status";

type LivStreamStandbyOverlayProps = {
  status: LivStreamSetupStatus | null;
  isLoading?: boolean;
  isStateSyncing?: boolean;
  syncError?: string | null;
};

export default function LivStreamStandbyOverlay({
  status,
  isLoading = false,
  isStateSyncing = false,
  syncError = null,
}: LivStreamStandbyOverlayProps) {
  if (isLoading && !status) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
          Checking broadcast readiness...
        </p>
      </div>
    );
  }

  if (isStateSyncing || isLivStreamLiveStatus(status)) {
    return null;
  }

  if (!status || status.canMountPlayer) return null;

  const headline =
    status.scheduleEnded
      ? "Tournament window has ended"
      : !status.hlsUrl || !status.manifestReachable
        ? "Live feed not available"
        : "Broadcast standby";

  const detail =
    syncError ??
    status.goLiveBlockers[0] ??
    status.readinessBlockers[0] ??
    "Production has not gone live on platform yet.";

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 px-6">
      <div className="max-w-md text-center">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#CCFF00]">
          {status.showTitle?.trim() || "LIV Golf Live"}
        </p>
        {status.eventLocation?.trim() ? (
          <p className="mt-1 font-mono text-[10px] uppercase liv-text-secondary">
            {status.eventLocation}
          </p>
        ) : null}
        <h2 className="mt-3 text-lg font-semibold text-white">{headline}</h2>
        <p className="mt-2 text-sm leading-relaxed liv-text-secondary">{detail}</p>
        <p className="mt-4 font-mono text-[10px] uppercase liv-text-secondary">
          publishStatus: {status.publishStatus} · phase: {status.eventPhase}
        </p>
        <Link
          href="/enterprise/liv-golf/streaming/setup"
          className="mt-6 inline-block rounded-full border border-[#CCFF00]/40 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#CCFF00] transition hover:bg-[#CCFF00]/10"
        >
          Open Stream Setup
        </Link>
      </div>
    </div>
  );
}
