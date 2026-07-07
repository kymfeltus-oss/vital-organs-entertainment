"use client";

import type { ReactNode } from "react";
import BrandLogo from "@/components/ui/layout/BrandLogo";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  className?: string;
  actions?: ReactNode;
  showLogo?: boolean;
  title?: string;
  subtitle?: string;
};

export default function AppHeader({
  className,
  actions,
  showLogo = true,
  title,
  subtitle,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-4 border-b px-4 py-3 pt-safe",
        className,
      )}
      style={{
        borderColor: "var(--theme-border)",
        backgroundColor: "color-mix(in srgb, var(--theme-surface) 88%, transparent)",
      }}
    >
      <div className="min-w-0 flex-1">
        {showLogo ? <BrandLogo size="sm" /> : null}
        {title ? (
          <div className={showLogo ? "mt-2" : ""}>
            <h1
              className="truncate text-lg font-semibold"
              style={{
                fontFamily: "var(--theme-font-headline)",
                color: "var(--theme-text)",
              }}
            >
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-sm" style={{ color: "var(--theme-text-muted)" }}>
                {subtitle}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
