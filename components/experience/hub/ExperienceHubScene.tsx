"use client";

import MasterStageBackground from "@/components/experience/MasterStageBackground";
import { EXPERIENCE_SCENE_VIGNETTE } from "@/lib/experience/hub-design-tokens";

/**
 * Decorative scene shell — master stage plate + optional vignette only.
 * UI in ExperienceHubDashboard renders at z-[50]+.
 */
export default function ExperienceHubScene() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#020207]"
      aria-hidden="true"
    >
      <MasterStageBackground />

      <div
        className="experience-hub-vignette pointer-events-none absolute inset-0 z-[1]"
        style={{ background: EXPERIENCE_SCENE_VIGNETTE }}
        aria-hidden="true"
      />
    </div>
  );
}
