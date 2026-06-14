"use client";

import MasterStageBackground from "@/components/experience/MasterStageBackground";

/** Full-screen master stage plate — no UI overlays. */
export default function ExperienceHubScene() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#020207]"
      aria-hidden="true"
    >
      <MasterStageBackground />
    </div>
  );
}
