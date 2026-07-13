"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Layers, Radio, RefreshCw, ShieldCheck, Tv } from "lucide-react";
import { getClientAppUrl } from "@/lib/client-api";

type StudioHeaderProps = {
  activeBetId: string | null;
  /** True when session.active_bet_id is not in the production catalog (blocks all Launch Live buttons). */
  isOrphanSession: boolean;
  streamLabel: string;
  streamIsLive: boolean;
  vmixStatus: string;
  isDispatching: boolean;
  onResetRefresh: () => Promise<void>;
  onSync: () => void;
};

export default function StudioHeader({
  activeBetId,
  isOrphanSession,
  streamLabel,
  streamIsLive,
  vmixStatus,
  isDispatching,
  onResetRefresh,
  onSync,
}: StudioHeaderProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleEmergencyReset = async () => {
    setIsResetting(true);
    setResetError(null);

    try {
      const response = await fetch(
        `${getClientAppUrl()}/api/enterprise/liv-golf/micro-bets/session`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activeBetId: null, phase: "OPEN" }),
        },
      );

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        const message =
          payload.error ??
          (response.status === 401 || response.status === 403
            ? "Owner sign-in required to clear the production session."
            : `Unable to clear session (HTTP ${response.status}).`);
        throw new Error(message);
      }

      await onResetRefresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Emergency session reset was denied.";
      setResetError(message);
      console.error("[Emergency Session Reset Denied]:", error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="mb-6 w-full rounded-2xl border border-[#222222] bg-[#161616] p-4 font-sans text-white shadow-xl md:p-6">
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-[#CCFF00]">
            LIV Live-Ops Switcher
          </span>
          <h1 className="mt-1 text-lg font-black uppercase tracking-tight">
            Prop Distribution Deck
          </h1>
          <p className="mt-1 text-[10px] font-medium tracking-wide text-zinc-500">
            PostgreSQL session · Supabase realtime · vMix broadcast lane
          </p>
        </div>

        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
          <div className="text-left sm:text-right">
            <span className="block font-mono text-[10px] uppercase text-zinc-500">
              Platform Stream
            </span>
            <span
              className={`font-mono text-xs font-bold tracking-wide ${
                activeBetId ? "text-[#CCFF00]" : "text-zinc-400"
              }`}
            >
              {activeBetId
                ? `● RECORD LOCKED (${activeBetId})`
                : "○ READY FOR DISPATCH"}
            </span>
          </div>

          {isOrphanSession ? (
            <button
              type="button"
              disabled={isResetting || isDispatching}
              onClick={() => void handleEmergencyReset()}
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-red-400 shadow-md transition-all hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isResetting ? "Clearing..." : "⚠ Clear Orphan Session"}
            </button>
          ) : null}

          {resetError ? (
            <p
              role="alert"
              className="max-w-xs rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-[10px] text-red-200"
            >
              {resetError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#222222] pt-4">
        <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-black/40 px-3 py-1.5 text-[11px] font-bold">
          <Radio
            className={`h-3.5 w-3.5 ${streamIsLive ? "animate-pulse text-[#CCFF00]" : "text-neutral-500"}`}
            aria-hidden
          />
          <span>
            STREAM:{" "}
            <span className={streamIsLive ? "text-[#CCFF00]" : "text-amber-500"}>{streamLabel}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-black/40 px-3 py-1.5 text-[11px] font-bold">
          <Tv className="h-3.5 w-3.5 text-[#CCFF00]" aria-hidden />
          <span>
            VMIX:{" "}
            <span className={vmixStatus === "ONLINE" ? "text-[#CCFF00]" : "text-amber-500"}>
              {vmixStatus}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-black/40 px-3 py-1.5 text-[11px] font-bold">
          <Layers className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
          <span>
            DISPATCHER:{" "}
            <span className={isDispatching ? "font-bold text-amber-500" : "text-[#CCFF00]"}>
              {isDispatching ? "SYNCING" : "READY"}
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={onSync}
          className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-black/40 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 transition hover:text-white"
        >
          <RefreshCw className="h-3 w-3" aria-hidden />
          Sync
        </button>

        <nav className="flex flex-wrap items-center gap-2 border-neutral-800 md:ml-auto md:border-l md:pl-4">
          <Link
            href="/enterprise/liv-golf/streaming/setup"
            className="px-2 py-1 text-[11px] font-bold text-neutral-400 transition-colors hover:text-white"
          >
            Stream Setup
          </Link>
          <span className="font-mono text-neutral-700">|</span>
          <Link
            href="/enterprise/liv-golf/live"
            className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold text-neutral-400 transition-colors hover:text-white"
          >
            <Eye className="h-3 w-3" aria-hidden />
            Fan Viewer
          </Link>
          <span className="font-mono text-neutral-700">|</span>
          <div className="flex items-center gap-1 rounded border border-neutral-700 bg-neutral-800 px-2 py-1 font-mono text-[10px] text-neutral-300">
            <ShieldCheck className="h-3 w-3 text-[#CCFF00]" aria-hidden />
            Studio-Operator Session
          </div>
        </nav>
      </div>
    </header>
  );
}
