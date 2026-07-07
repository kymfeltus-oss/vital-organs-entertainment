"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ActionCardProps = {
  href: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  className?: string;
};

export default function ActionCard({
  href,
  label,
  description,
  icon: Icon,
  className,
}: ActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lg touch-target",
        className,
      )}
      style={{
        borderColor: "var(--theme-border)",
        backgroundColor: "var(--theme-surface)",
      }}
    >
      <span
        className="inline-flex size-10 items-center justify-center rounded-xl"
        style={{
          backgroundColor: "color-mix(in srgb, var(--theme-primary) 18%, transparent)",
          color: "var(--theme-primary)",
        }}
      >
        <Icon className="size-5" strokeWidth={2} aria-hidden="true" />
      </span>
      <div>
        <p
          className="font-semibold"
          style={{ fontFamily: "var(--theme-font-ui)", color: "var(--theme-text)" }}
        >
          {label}
        </p>
        {description ? (
          <p className="mt-1 text-sm leading-snug" style={{ color: "var(--theme-text-muted)" }}>
            {description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
