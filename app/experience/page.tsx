import ExperienceHubDashboard from "@/components/experience/hub/ExperienceHubDashboard";
import { ACTUAL_ASSET_MAP } from "@/lib/experience/hub-design-tokens";
import { loadExperienceHubPayload } from "@/lib/experience/load-experience-hub-payload";

export const revalidate = 0;

export default async function ExperienceHubPage() {
  const initialPayload = await loadExperienceHubPayload();

  return (
    <>
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
        type="image/webp"
        fetchPriority="high"
        media="(max-width: 767px) and (orientation: portrait)"
      />
      <ExperienceHubDashboard initialPayload={initialPayload} />
    </>
  );
}
