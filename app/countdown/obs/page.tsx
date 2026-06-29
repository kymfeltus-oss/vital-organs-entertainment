import type { Metadata } from "next";
import PublicCountdownExperience from "@/components/countdown/PublicCountdownExperience";
import ObsProgramGraphicsOverlay from "@/components/graphics/ObsProgramGraphicsOverlay";
import { computeCountdown } from "@/lib/live/event-lobby";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";
import { loadActiveProgramGraphic } from "@/lib/graphics/program-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "300 Awakening OBS Countdown",
  description: "Horizontal stream overlay countdown for OBS and Restream.",
  robots: { index: false, follow: false },
};

/** Compact horizontal strip — ideal for 1920×540 OBS browser sources. */
export default async function PublicCountdownObsPage() {
  const [initialConfig, initialGraphic] = await Promise.all([
    loadActiveCountdownConfig(),
    loadActiveProgramGraphic().catch(() => null),
  ]);
  const initialCountdown = computeCountdown(initialConfig.start_time);

  return (
    <>
      <PublicCountdownExperience
        initialConfig={initialConfig}
        initialCountdown={initialCountdown}
        mode="obs"
      />
      <ObsProgramGraphicsOverlay initialGraphic={initialGraphic} />
    </>
  );
}
