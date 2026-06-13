"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Shield } from "lucide-react";
import type { OpsSnapshot } from "@/lib/ops/types";
import {
  isOpsTeamRole,
  modulesForRole,
  OPS_TEAM_ROLE_STORAGE_KEY,
  roleLabel,
  type OpsTeamRole,
} from "@/lib/ops/team-roles";

const ROLE_OPTIONS: OpsTeamRole[] = [
  "admin",
  "producer",
  "broadcast_operator",
  "prayer_team",
];

type LiveHubRoleRouterClientProps = {
  adminEmail: string;
  initialSnapshot: OpsSnapshot;
};

export default function LiveHubRoleRouterClient({
  adminEmail,
  initialSnapshot,
}: LiveHubRoleRouterClientProps) {
  const [role, setRole] = useState<OpsTeamRole>("admin");

  useEffect(() => {
    const stored = sessionStorage.getItem(OPS_TEAM_ROLE_STORAGE_KEY);
    if (isOpsTeamRole(stored)) {
      setRole(stored);
    }
  }, []);

  const visibleModules = useMemo(() => modulesForRole(role), [role]);

  const handleRoleChange = (nextRole: OpsTeamRole) => {
    setRole(nextRole);
    sessionStorage.setItem(OPS_TEAM_ROLE_STORAGE_KEY, nextRole);
  };

  return (
    <main className="min-h-dvh w-full bg-brand-black pt-safe pb-safe text-white">
      <div className="w-full px-4 py-6 md:px-8 lg:px-10">
        <header className="mb-8 border-b border-brand-border pb-6">
          <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.28em] text-brand-blue">
            Crew Terminal
          </p>
          <h1 className="mt-2 font-headline text-fluid-section uppercase tracking-[0.12em]">
            Live Hub Router
          </h1>
          <p className="mt-3 font-body text-sm text-brand-muted">
            Signed in as {adminEmail}. Select a mock crew role to simulate staff access boundaries.
          </p>
        </header>

        <section className="glass-panel mb-8 rounded-2xl border border-brand-border p-5">
          <div className="mb-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-brand-pink" aria-hidden="true" />
            <p className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.18em] text-brand-muted">
              Mock Role Profile
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleRoleChange(option)}
                aria-pressed={role === option}
                className={`touch-target rounded-full border px-4 py-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] transition ${
                  role === option
                    ? "border-brand-blue/50 bg-brand-blue/15 text-white"
                    : "border-brand-border bg-brand-panel text-brand-muted hover:border-brand-blue/30 hover:text-white"
                }`}
              >
                {roleLabel(option)}
              </button>
            ))}
          </div>
        </section>

        <section className="glass-panel mb-8 rounded-2xl border border-brand-border p-5">
          <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.2em] text-brand-muted">
            Broadcast Snapshot
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-brand-border bg-brand-panel p-4">
              <p className="font-ui text-[0.52rem] uppercase tracking-[0.14em] text-brand-muted">Stream</p>
              <p className="mt-2 font-card-title text-lg uppercase text-white">
                {initialSnapshot.stream.isLive ? "Live" : "Standby"}
              </p>
            </div>
            <div className="rounded-xl border border-brand-border bg-brand-panel p-4">
              <p className="font-ui text-[0.52rem] uppercase tracking-[0.14em] text-brand-muted">Attendees</p>
              <p className="mt-2 font-card-title text-lg uppercase text-white">
                {initialSnapshot.metrics.paidAttendees}
              </p>
            </div>
            <div className="rounded-xl border border-brand-border bg-brand-panel p-4">
              <p className="font-ui text-[0.52rem] uppercase tracking-[0.14em] text-brand-muted">Chat (10m)</p>
              <p className="mt-2 font-card-title text-lg uppercase text-white">
                {initialSnapshot.realtime.recentChatMessages10m}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-brand-muted">
            {roleLabel(role)} Access
          </h2>
          {visibleModules.length === 0 ? (
            <p className="font-body text-sm text-brand-muted">No modules visible for this role.</p>
          ) : (
            <div className="card-grid-responsive">
              {visibleModules.map((module) => (
                <Link
                  key={module.id}
                  href={module.href}
                  className="glass-panel group rounded-2xl border border-brand-border p-5 transition hover:border-brand-pink/40"
                >
                  {module.badge ? (
                    <span className="mb-3 inline-flex rounded-full border border-brand-border px-2 py-0.5 font-ui text-[0.48rem] font-bold uppercase tracking-[0.12em] text-brand-blue">
                      {module.badge}
                    </span>
                  ) : null}
                  <h3 className="font-card-title text-lg uppercase tracking-[0.08em] text-white group-hover:text-brand-pink">
                    {module.title}
                  </h3>
                  <p className="mt-2 font-body text-xs leading-relaxed text-brand-muted">
                    {module.description}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
