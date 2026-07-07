"use client";

import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export type PlatformTierId = "starter" | "pro" | "enterprise";

export function handlePlanSelection(tierId: PlatformTierId) {
  if (tierId === "enterprise") {
    window.location.href = "/contact-us?intent=enterprise";
    return;
  }

  window.location.href = `/onboarding?tier=${tierId}`;
}

type PlanSelectionCtaProps = {
  tierId: PlatformTierId;
  className?: string;
  children: ReactNode;
};

export default function PlanSelectionCta({ tierId, className, children }: PlanSelectionCtaProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => handlePlanSelection(tierId)}
    >
      {children}
      <ArrowRight size={18} aria-hidden="true" />
    </button>
  );
}
