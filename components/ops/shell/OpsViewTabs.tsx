"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type OpsViewTab = {
  id: string;
  label: string;
  href: string;
};

type OpsViewTabsProps = {
  tabs: OpsViewTab[];
  activeId: string;
  ariaLabel: string;
};

export default function OpsViewTabs({ tabs, activeId, ariaLabel }: OpsViewTabsProps) {
  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "touch-target rounded-lg border px-3 py-1.5 font-ui text-[0.52rem] font-bold uppercase tracking-[0.12em] transition",
              isActive
                ? "border-brand-blue/40 bg-brand-blue/15 text-brand-blue"
                : "border-brand-border bg-brand-black/40 text-brand-muted hover:border-brand-border hover:text-white",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
