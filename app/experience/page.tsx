import ExperienceHubScene from "@/components/experience/hub/ExperienceHubScene";
import { ACTUAL_ASSET_MAP } from "@/lib/experience/hub-design-tokens";
import "@/styles/awakening.css";

export const revalidate = 0;

export default function ExperienceHubPage() {
  return (
    <main className="relative isolate min-h-dvh h-dvh w-full overflow-hidden bg-[#020207]">
      <link
        rel="preload"
        as="image"
        href={ACTUAL_ASSET_MAP.masterStageBackground}
        type="image/webp"
        fetchPriority="high"
        media="(min-width: 768px), (max-width: 767px) and (orientation: landscape)"
      />
      <link
        rel="preload"
        as="image"
        href={ACTUAL_ASSET_MAP.masterStageBackgroundMobile}
        type="image/png"
        fetchPriority="high"
        media="(max-width: 767px) and (orientation: portrait)"
      />
      <ExperienceHubScene />
    </main>
  );
}
