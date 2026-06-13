import ExperienceHubClient from "@/components/experience/ExperienceHubClient";
import { loadExperienceHubStatus } from "@/lib/experience/load-experience-hub-status";

export default async function ExperienceHubPage() {
  const initialStatus = await loadExperienceHubStatus();

  return <ExperienceHubClient initialStatus={initialStatus} />;
}
