import OwnerOnboardingClient from "@/components/onboarding/OwnerOnboardingClient";
import type { PlatformTierId } from "@/components/admin/PlanSelectionCta";

type OnboardingPageProps = {
  searchParams: Promise<{ tier?: string }>;
};

function resolveSelectedTier(value: string | undefined): PlatformTierId {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "pro" || normalized === "enterprise") return normalized;
  return "starter";
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = await searchParams;
  const selectedTier = resolveSelectedTier(params.tier);

  return (
    <main className="min-h-dvh bg-[#020203] text-white">
      <OwnerOnboardingClient selectedTier={selectedTier} />
    </main>
  );
}
