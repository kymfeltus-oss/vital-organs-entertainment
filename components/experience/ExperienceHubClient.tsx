"use client";

import ExperienceHubDashboard from "@/components/experience/hub/ExperienceHubDashboard";
import type { ExperienceHubPayload } from "@/lib/experience/hub-content";

type ExperienceHubClientProps = {
  initialPayload: ExperienceHubPayload;
};

/** @deprecated Prefer ExperienceHubDashboard — kept for existing imports. */
export default function ExperienceHubClient({ initialPayload }: ExperienceHubClientProps) {
  return <ExperienceHubDashboard initialPayload={initialPayload} />;
}
