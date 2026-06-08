"use client";

import {
  Clapperboard,
  Radio,
  Server,
  Share2,
  Shield,
  UserPlus,
} from "lucide-react";
import type { GoLiveDecision } from "@/lib/live-hub/safety";

type LiveHubLowerPanelsProps = {
  goLiveDecision: GoLiveDecision;
  backupConfigured: boolean;
  onRunRehearsal: () => void;
  onTestStream: () => void;
  onShareStream: () => void;
};

export default function LiveHubLowerPanels({
  goLiveDecision,
  backupConfigured,
  onRunRehearsal,
  onTestStream,
  onShareStream,
}: LiveHubLowerPanelsProps) {
  const backupReady =
    backupConfigured && goLiveDecision.criticalIssues.every((i) => i.id !== "primary_missing");

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <section className="rounded-2xl border border-white/10 bg-[#111111]/95 p-4">
        <h3 className="text-[0.58rem] font-bold uppercase tracking-[0.22em] text-zinc-400">
          Next Up
        </h3>
        <div className="mt-3 flex gap-3">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-[#B0267A]/35 bg-gradient-to-br from-[#1E40AF]/20 to-[#B0267A]/15">
            <Clapperboard className="h-8 w-8 text-[#93c5fd]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-widest text-white">
              Opening Worship Set
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Main stage mix · lower third armed · choir standby cue ready.
            </p>
            <p className="mt-2 text-[0.55rem] font-bold uppercase tracking-[0.14em] text-[#1E40AF]">
              Cue in 12:00
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#111111]/95 p-4">
        <h3 className="text-[0.58rem] font-bold uppercase tracking-[0.22em] text-zinc-400">
          Quick Actions
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            { label: "Run Rehearsal", icon: Clapperboard, action: onRunRehearsal },
            { label: "Test Stream", icon: Radio, action: onTestStream },
            { label: "Share Stream", icon: Share2, action: onShareStream },
            { label: "Invite Team", icon: UserPlus, action: undefined },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              disabled={!item.action}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#0B090A]/80 px-3 py-3 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-zinc-400 transition enabled:hover:border-[#1E40AF]/40 enabled:hover:text-[#93c5fd] disabled:opacity-60"
            >
              <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#111111]/95 p-4">
        <h3 className="text-[0.58rem] font-bold uppercase tracking-[0.22em] text-zinc-400">
          Safety Net
        </h3>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-white/8 bg-[#0B090A]/80 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#93c5fd]" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-300">
                Automatic Backup
              </span>
            </div>
            <span
              className={`text-[0.55rem] font-bold uppercase tracking-[0.12em] ${
                backupReady ? "text-[#93c5fd]" : "text-zinc-500"
              }`}
            >
              {backupReady ? "Ready" : "Standby"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/8 bg-[#0B090A]/80 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-[#1E40AF]" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-300">
                Failover Server
              </span>
            </div>
            <span className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-zinc-500">
              Standby
            </span>
          </div>
        </div>
        {goLiveDecision.criticalIssues.length > 0 ? (
          <p className="mt-3 text-xs text-[#f5c2e0]">
            {goLiveDecision.criticalIssues.length} critical issue
            {goLiveDecision.criticalIssues.length === 1 ? "" : "s"} before Go Live.
          </p>
        ) : (
          <p className="mt-3 text-xs text-[#93c5fd]">All critical safety checks passing.</p>
        )}
      </section>
    </div>
  );
}
