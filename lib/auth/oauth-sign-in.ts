import {
  DEFAULT_ATTENDEE_NEXT,
  sanitizeNextPath,
} from "@/lib/auth/routing";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export type OAuthProviderId = "apple" | "google" | "facebook";

const PROVIDER_LABELS: Record<OAuthProviderId, string> = {
  apple: "Apple",
  google: "Google",
  facebook: "Facebook",
};

export function buildClientAuthCallbackUrl(nextPath: string): string {
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("next", nextPath);
  return url.toString();
}

export async function startOAuthSignIn(
  provider: OAuthProviderId,
  nextPath?: string | null,
): Promise<{ error?: string }> {
  const supabase = createBrowserSupabaseClient();
  const next = sanitizeNextPath(nextPath ?? null, DEFAULT_ATTENDEE_NEXT);
  const redirectTo = buildClientAuthCallbackUrl(next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      ...(provider === "google" ? { queryParams: { prompt: "select_account" } } : {}),
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.url) {
    return { error: `Unable to start ${PROVIDER_LABELS[provider]} sign-in.` };
  }

  window.location.assign(data.url);
  return {};
}
