"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageIcon, Play } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

type HeroBannerProps = {
  title: string;
  description?: string;
  href?: string;
  ctaLabel?: string;
  imageUrl?: string | null;
  className?: string;
};

export default function HeroBanner({
  title,
  description,
  href,
  ctaLabel = "Watch now",
  imageUrl,
  className,
}: HeroBannerProps) {
  const { theme } = useTheme();
  const heroSrc = imageUrl ?? theme.heroImageUrl;

  const content = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-5 transition hover:border-[var(--theme-primary)]",
        className,
      )}
      style={{
        borderColor: "var(--theme-border)",
        background: "var(--theme-surface-gradient)",
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className="relative flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl sm:h-24 sm:w-40"
          style={{ backgroundColor: "color-mix(in srgb, var(--theme-bg) 70%, transparent)" }}
        >
          {heroSrc ? (
            <Image src={heroSrc} alt="" fill className="object-cover" sizes="160px" />
          ) : (
            <ImageIcon className="size-8" style={{ color: "var(--theme-text-muted)" }} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--theme-font-headline)", color: "var(--theme-text)" }}
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>
              {description}
            </p>
          ) : null}
          {href ? (
            <span
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium"
              style={{ color: "var(--theme-primary)" }}
            >
              <Play className="size-3.5" aria-hidden="true" />
              {ctaLabel}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block touch-target" aria-label={title}>
        {content}
      </Link>
    );
  }

  return content;
}
