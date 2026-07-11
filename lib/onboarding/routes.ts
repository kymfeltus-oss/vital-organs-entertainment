export const ONBOARDING_PATH = "/onboarding";
export const ONBOARDING_LOGIN_PATH = "/onboarding/login";

export function buildOnboardingLoginUrl(options?: {
  next?: string;
  email?: string;
  tier?: string;
}): string {
  const params = new URLSearchParams();
  const next = options?.next?.trim() || ONBOARDING_PATH;
  params.set("next", next);

  if (options?.email?.trim()) {
    params.set("email", options.email.trim().toLowerCase());
  }
  if (options?.tier?.trim()) {
    params.set("tier", options.tier.trim().toLowerCase());
  }

  return `${ONBOARDING_LOGIN_PATH}?${params.toString()}`;
}
