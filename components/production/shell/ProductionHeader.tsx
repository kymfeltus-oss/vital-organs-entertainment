"use client";

import { Bell, Circle, HelpCircle, RefreshCw } from "lucide-react";
import { PRODUCTION_TENANT_LABEL } from "@/lib/production/nav";
import { cn } from "@/lib/utils";

type ProductionHeaderProps = {
  operatorEmail: string;
  roleDisplay: string;
  profileInitials: string;
  systemHealthy: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  title?: string;
};

function displayName(email: string): string {
  const local = email.split("@")[0]?.trim();
  if (!local) return "Producer";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function ProductionHeader({
  operatorEmail,
  roleDisplay,
  profileInitials,
  systemHealthy,
  isRefreshing = false,
  onRefresh,
  title = "Overview Dashboard",
}: ProductionHeaderProps) {
  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-brand-border bg-brand-black/90 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <div className="rounded-lg border border-brand-border bg-brand-panel px-3 py-1.5">
          <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
            Tenant
          </p>
          <p className="font-body text-sm text-white">{PRODUCTION_TENANT_LABEL}</p>
        </div>
        <div>
          <h1 className="font-headline text-lg uppercase tracking-[0.08em] text-white md:text-xl">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em]",
            systemHealthy
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-amber-500/30 bg-amber-500/10 text-amber-400",
          )}
        >
          <Circle
            className={cn(
              "h-2 w-2 fill-current",
              systemHealthy ? "animate-pulse text-emerald-400" : "text-amber-400",
            )}
            aria-hidden="true"
          />
          {systemHealthy ? "All Systems Operational" : "Attention Required"}
        </span>

        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh dashboard"
            className="touch-target inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border text-brand-muted transition hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} aria-hidden="true" />
          </button>
        ) : null}

        <button
          type="button"
          aria-label="Notifications"
          className="relative touch-target inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border text-brand-muted transition hover:text-white"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#53fc18] text-[0.55rem] font-bold text-black">
            3
          </span>
        </button>

        <button
          type="button"
          aria-label="Help"
          className="touch-target hidden h-9 w-9 items-center justify-center rounded-lg border border-brand-border text-brand-muted transition hover:text-white sm:inline-flex"
        >
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2 rounded-lg border border-brand-border bg-brand-panel px-2 py-1.5">
          <div
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00f2ff]/20 text-xs font-bold text-[#00f2ff]"
          >
            {profileInitials}
          </div>
          <div className="hidden sm:block">
            <p className="font-ui text-[0.55rem] font-bold uppercase tracking-[0.08em] text-white">
              {displayName(operatorEmail)}
            </p>
            <p className="font-body text-[0.65rem] text-brand-muted">{roleDisplay}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
