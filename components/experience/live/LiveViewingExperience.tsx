"use client";

import type { ReactNode } from "react";
import AttendeeStreamPlayer from "@/components/experience/live/AttendeeStreamPlayer";

type LiveViewingExperienceProps = {
  showPaywall: boolean;
  paywallOverlay?: ReactNode;
};

export default function LiveViewingExperience({
  showPaywall,
  paywallOverlay,
}: LiveViewingExperienceProps) {
  return (
    <AttendeeStreamPlayer
      enabled
      showPaywall={showPaywall}
      paywallOverlay={paywallOverlay}
    />
  );
}
