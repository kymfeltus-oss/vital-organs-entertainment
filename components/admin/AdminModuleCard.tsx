"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Lock,
  Palette,
  Plug,
  Radio,
  Share2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import type { AdminModule } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  palette: Palette,
  sliders: SlidersHorizontal,
  share: Share2,
  radio: Radio,
  chart: BarChart3,
  sparkles: Sparkles,
  plug: Plug,
};

type AdminModuleCardProps = {
  module: AdminModule;
};

export default function AdminModuleCard({ module }: AdminModuleCardProps) {
  const Icon = ICONS[module.icon] ?? Sparkles;
  const isAvailable = module.status === "available";
  const isComingSoon = module.status === "coming-soon";

  const body = (
    <article
      className={cn(
        "theme-card flex h-full flex-col rounded-2xl p-5 transition",
        isAvailable && "hover:theme-card--active hover:border-[color:var(--theme-primary)]",
        !isAvailable && "opacity-75",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-xl"
          style={{
            background: "color-mix(in srgb, var(--theme-primary) 14%, transparent)",
            color: "var(--theme-primary)",
          }}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <span
          className="theme-label rounded-full px-2 py-1"
          style={{
            background: "color-mix(in srgb, var(--theme-surface) 80%, transparent)",
            color: "var(--theme-text-muted)",
          }}
        >
          {module.tierLabel}
        </span>
      </div>

      <h3
        className="mt-4 text-base font-semibold"
        style={{ fontFamily: "var(--theme-font-headline)", color: "var(--theme-text)" }}
      >
        {module.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>
        {module.description}
      </p>

      <div className="mt-4 flex items-center justify-between gap-2">
        {isAvailable ? (
          <span className="text-xs font-semibold" style={{ color: "var(--theme-primary)" }}>
            Open module →
          </span>
        ) : isComingSoon ? (
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--theme-text-muted)" }}>
            Coming soon
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--theme-text-muted)" }}>
            <Lock className="size-3.5" aria-hidden="true" />
            Upgrade to {module.tierLabel}
          </span>
        )}
      </div>
    </article>
  );

  if (!isAvailable) {
    return <div className="h-full cursor-not-allowed">{body}</div>;
  }

  const isExternal = module.href.startsWith("/live") || module.href.startsWith("/attendee");
  if (isExternal) {
    return (
      <Link href={module.href} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--theme-primary)]">
        {body}
      </Link>
    );
  }

  return (
    <Link href={module.href} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--theme-primary)]">
      {body}
    </Link>
  );
}
