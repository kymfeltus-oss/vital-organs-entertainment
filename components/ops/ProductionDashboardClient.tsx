"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ExternalLink,
  LayoutDashboard,
  Radio,
  Shield,
  Users,
} from "lucide-react";
import ProductionPathBanner from "@/components/ops/ProductionPathBanner";
import type { OpsSnapshot } from "@/lib/ops/types";
import {
  OPS_PRODUCTION_SECTION_LABELS,
  OPS_PRODUCTION_SECTION_ORDER,
} from "@/lib/ops/production-sections";
import {
  isOpsTeamRole,
  modulesForRoleBySection,
  roleLabel,
  type OpsHubModule,
  type OpsTeamRole,
} from "@/lib/ops/team-roles";

const ROLE_OPTIONS: OpsTeamRole[] = [
  "admin",
  "producer",
  "broadcast_operator",
  "prayer_team",
  "camera_crew",
];

type ProductionDashboardClientProps = {
  operatorEmail: string;
  initialSnapshot: OpsSnapshot;
};

function ModuleCard({ module }: { module: OpsHubModule }) {
  const className =
    "glass-panel group flex h-full flex-col rounded-2xl border border-brand-border p-5 transition hover:border-brand-pink/40 hover:shadow-[0_0_24px_rgba(255,47,175,0.12)]";

  const content = (
    <>
      {module.badge ? (
        <span className="mb-3 inline-flex w-fit rounded-full border border-brand-border px-2.5 py-0.5 font-ui text-[0.48rem] font-bold uppercase tracking-[0.12em] text-brand-blue">
          {module.badge}
        </span>
      ) : null}
      <h3 className="font-card-title text-lg uppercase tracking-[0.08em] text-white group-hover:text-brand-pink">
        {module.title}
      </h3>
      <p className="mt-2 flex-1 font-body text-xs leading-relaxed text-brand-muted">
        {module.description}
      </p>
      <span className="mt-4 inline-flex items-center gap-1.5 font-ui text-[0.52rem] font-bold uppercase tracking-[0.14em] text-brand-blue">
        {module.external ? "Open preview" : "Open"}
        {module.external ? (
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
        )}
      </span>
    </>
  );

  if (module.external) {
    return (
      <a
        href={module.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={module.href} className={className}>
      {content}
    </Link>
  );
}

/** Production menu hub — routes operators to show-day consoles by role. */
export default function ProductionDashboardClient({
  operatorEmail,
  initialSnapshot,
}: ProductionDashboardClientProps) {
  const [role, setRole] = useState<OpsTeamRole>("admin");
  const [isSavingRole, setIsSavingRole] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      try {
        const response = await fetch("/api/ops/crew-role", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok || cancelled) return;

        const data = (await response.json()) as { role?: string };
        if (isOpsTeamRole(data.role)) {
          setRole(data.role);
        }
      } catch {
        // Default admin until server role resolves.
      }
    }

    void loadRole();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRoleChange = useCallback(async (nextRole: OpsTeamRole) => {
    setIsSavingRole(true);
    try {
      const response = await fetch("/api/ops/crew-role", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
        cache: "no-store",
      });

      if (!response.ok) return;
      setRole(nextRole);
    } catch {
      // Role cookie unchanged on failure.
    } finally {
      setIsSavingRole(false);
    }
  }, []);

  const modulesBySection = useMemo(
    () =>
      modulesForRoleBySection(role, {
        excludeModuleIds: ["ops_home"],
      }),
    [role],
  );

  const visibleModuleCount = useMemo(() => {
    let count = 0;
    for (const section of OPS_PRODUCTION_SECTION_ORDER) {
      count += modulesBySection.get(section)?.length ?? 0;
    }
    return count;
  }, [modulesBySection]);

  const isLive = initialSnapshot.stream.isLive;

  return (
    <main className="min-h-dvh w-full bg-brand-black pt-safe pb-safe text-white">
      <ProductionPathBanner isLive={isLive} />

      <div className="w-full px-4 py-6 md:px-8 lg:px-10">
        <header className="mb-8 border-b border-brand-border pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.28em] text-brand-blue">
                300 Awakening Production
              </p>
              <h1 className="mt-2 flex items-center gap-3 font-headline text-fluid-section uppercase tracking-[0.12em]">
                <LayoutDashboard className="h-7 w-7 text-brand-pink" aria-hidden="true" />
                Production Dashboard
              </h1>
              <p className="mt-3 max-w-2xl font-body text-sm text-brand-muted">
                Choose a console below to run pre-show setup, live operations, or monitoring.
                Signed in as{" "}
                <span className="text-white">{operatorEmail}</span>.
              </p>
            </div>

            <div
              className={`rounded-xl border px-4 py-3 font-ui text-xs ${
                isLive
                  ? "border-brand-pink/40 bg-brand-pink/10 text-brand-pink"
                  : "border-brand-border bg-brand-panel text-brand-muted"
              }`}
            >
              <p className="flex items-center gap-2 font-bold uppercase tracking-[0.14em]">
                <Radio className="h-3.5 w-3.5" aria-hidden="true" />
                {isLive ? "Broadcast Live" : "Stream Standby"}
              </p>
              <p className="mt-1 text-[0.62rem] text-brand-muted">
                {initialSnapshot.metrics.paidAttendees.toLocaleString("en-US")} attendees ·{" "}
                {initialSnapshot.realtime.recentChatMessages10m} chat (10m)
              </p>
            </div>
          </div>
        </header>

        <section className="glass-panel mb-8 rounded-2xl border border-brand-border p-5">
          <div className="mb-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-brand-pink" aria-hidden="true" />
            <div>
              <p className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.18em] text-brand-muted">
                Crew Role Profile
              </p>
              <p className="mt-1 font-body text-xs text-brand-muted">
                Filters which consoles appear in your menu. Enforced on save actions.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => void handleRoleChange(option)}
                disabled={isSavingRole}
                aria-pressed={role === option}
                className={`touch-target rounded-full border px-4 py-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] transition disabled:opacity-60 ${
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

        {visibleModuleCount === 0 ? (
          <p className="font-body text-sm text-brand-muted">
            No production consoles are visible for the {roleLabel(role)} role.
          </p>
        ) : (
          <div className="space-y-10">
            {OPS_PRODUCTION_SECTION_ORDER.map((section) => {
              const modules = modulesBySection.get(section);
              if (!modules?.length) return null;

              const meta = OPS_PRODUCTION_SECTION_LABELS[section];

              return (
                <section key={section} aria-labelledby={`production-section-${section}`}>
                  <div className="mb-4 flex items-start gap-3">
                    <Users
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand-purple"
                      aria-hidden="true"
                    />
                    <div>
                      <h2
                        id={`production-section-${section}`}
                        className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-white"
                      >
                        {meta.title}
                      </h2>
                      <p className="mt-1 font-body text-xs text-brand-muted">{meta.description}</p>
                    </div>
                  </div>
                  <div className="card-grid-responsive">
                    {modules.map((module) => (
                      <ModuleCard key={module.id} module={module} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
