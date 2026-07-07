"use client";

import Link from "next/link";
import { ArrowUpRight, Layers3, ShieldCheck } from "lucide-react";
import AdminModuleCard from "@/components/admin/AdminModuleCard";
import AppHeader from "@/components/ui/layout/AppHeader";
import PageContainer from "@/components/ui/layout/PageContainer";
import { countAvailableModules, listAdminModules } from "@/lib/admin/modules";
import { ADMIN_TIER_LABELS } from "@/lib/admin/tiers";
import type { TenantAdminContext } from "@/lib/admin/types";
import { PLATFORM_APP_NAME, PLATFORM_TAGLINE } from "@/lib/theme/brand";

type AdminHubClientProps = {
  context: TenantAdminContext;
};

export default function AdminHubClient({ context }: AdminHubClientProps) {
  const modules = listAdminModules(context);
  const availableCount = countAvailableModules(context);

  return (
    <div className="flex min-h-dvh w-full flex-col">
      <AppHeader
        title="Visual Admin Dashboard"
        subtitle={`Self-service controls for ${PLATFORM_APP_NAME}`}
        actions={
          <Link
            href="/admin/settings/branding"
            className="theme-button-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold"
          >
            Customize branding
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <PageContainer maxWidth="lg" className="py-6">
          <section className="theme-card rounded-2xl p-6">
            <p className="theme-label">Platform status</p>
            <h2
              className="mt-2 text-2xl font-semibold"
              style={{ fontFamily: "var(--theme-font-headline)", color: "var(--theme-text)" }}
            >
              {PLATFORM_APP_NAME}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>
              {PLATFORM_TAGLINE}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatCard
                icon={Layers3}
                label="Active modules"
                value={`${availableCount} / ${modules.length}`}
              />
              <StatCard
                icon={ShieldCheck}
                label="Current tier"
                value={ADMIN_TIER_LABELS[context.tier]}
              />
              <StatCard
                icon={ArrowUpRight}
                label="Enterprise overrides"
                value={context.enterpriseOverrides ? "Custom" : "None"}
              />
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="theme-label">Self-service modules</p>
                <h3
                  className="mt-1 text-lg font-semibold"
                  style={{ fontFamily: "var(--theme-font-headline)", color: "var(--theme-text)" }}
                >
                  Configure your white-label experience
                </h3>
              </div>
              <p className="text-xs" style={{ color: "var(--theme-text-muted)" }}>
                Locked cards show the minimum tier required. Enterprise tenants can append overrides later.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {modules.map((module) => (
                <AdminModuleCard key={module.id} module={module} />
              ))}
            </div>
          </section>
        </PageContainer>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers3;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{
        borderColor: "var(--theme-border)",
        background: "color-mix(in srgb, var(--theme-bg) 55%, transparent)",
      }}
    >
      <div className="flex items-center gap-2">
        <Icon className="size-4" style={{ color: "var(--theme-primary)" }} aria-hidden="true" />
        <span className="theme-label">{label}</span>
      </div>
      <p className="mt-2 text-lg font-semibold" style={{ color: "var(--theme-text)" }}>
        {value}
      </p>
    </div>
  );
}
