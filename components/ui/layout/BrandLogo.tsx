"use client";

import Image from "next/image";
import { Building2 } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
};

const SIZE_MAP = {
  sm: { box: "h-8 w-8", text: "text-sm" },
  md: { box: "h-10 w-10", text: "text-base" },
  lg: { box: "h-14 w-14", text: "text-lg" },
} as const;

export default function BrandLogo({
  className,
  size = "md",
  showName = true,
}: BrandLogoProps) {
  const { theme } = useTheme();
  const logoUrl = theme.logoUrl ?? theme.logoUrlDark;
  const sizeClass = SIZE_MAP[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border",
          sizeClass.box,
        )}
        style={{
          borderColor: "var(--theme-border)",
          backgroundColor: "var(--theme-surface)",
        }}
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={`${theme.appName} logo`}
            fill
            sizes="56px"
            className="object-contain p-1.5"
          />
        ) : (
          <Building2
            className="size-5"
            style={{ color: "var(--theme-primary)" }}
            aria-hidden="true"
          />
        )}
      </div>
      {showName ? (
        <div className="min-w-0">
          <p
            className={cn("truncate font-semibold leading-tight", sizeClass.text)}
            style={{
              fontFamily: "var(--theme-font-headline)",
              color: "var(--theme-text)",
            }}
          >
            {theme.appName}
          </p>
          {theme.tagline ? (
            <p
              className="truncate text-xs"
              style={{ color: "var(--theme-text-muted)" }}
            >
              {theme.tagline}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
