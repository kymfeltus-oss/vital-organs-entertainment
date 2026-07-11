import type { Metadata } from "next";
import OnboardingLoginClient from "@/components/onboarding/OnboardingLoginClient";
import { ONBOARDING_PATH } from "@/lib/onboarding/routes";
import { PLATFORM_APP_NAME } from "@/lib/theme/brand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Onboarding Sign In | ${PLATFORM_APP_NAME}`,
  description: "Sign in to resume ministry operator onboarding.",
  robots: { index: false, follow: false },
};

type OnboardingLoginPageProps = {
  searchParams: Promise<{
    next?: string;
    email?: string;
    error?: string;
  }>;
};

export default async function OnboardingLoginPage({ searchParams }: OnboardingLoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next?.trim() || ONBOARDING_PATH;
  const initialEmail = params.email?.trim() ?? "";

  return (
    <OnboardingLoginClient
      nextPath={nextPath}
      initialEmail={initialEmail}
      authError={params.error ?? null}
    />
  );
}
