"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "full";
};

const MAX_WIDTH: Record<NonNullable<PageContainerProps["maxWidth"]>, string> = {
  sm: "max-w-lg",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  full: "max-w-full",
};

export default function PageContainer({
  children,
  className,
  maxWidth = "md",
}: PageContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-4 py-6 pb-safe", MAX_WIDTH[maxWidth], className)}
      style={{ color: "var(--theme-text)" }}
    >
      {children}
    </div>
  );
}
