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

function mapOAuthStartError(message: string, provider: OAuthProviderId): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("provider") &&
    (lower.includes("not enabled") ||
      lower.includes("disabled") ||
      lower.includes("unsupported"))
  ) {
    return `${PROVIDER_LABELS[provider]} sign-in is not enabled in Supabase yet. Ask ops to enable the provider and add OAuth credentials.`;
  }

  if (lower.includes("redirect") && lower.includes("url")) {
    return `${PROVIDER_LABELS[provider]} sign-in failed: add ${window.location.origin}/auth/callback to Supabase Auth redirect URLs.`;
  }

  if (lower.includes("invalid") && lower.includes("client")) {
    return `${PROVIDER_LABELS[provider]} sign-in failed: check the OAuth client ID and secret in Supabase Auth providers.`;
  }

  return message;
}

/** Post-login destination preserved for `app/auth/callback` (AuthCallbackClient). */
export function buildClientAuthCallbackUrl(nextPath: string): string {
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("next", nextPath);
  return url.toString();
}

/**
 * Starts Supabase OAuth for Apple, Google, or Facebook.
 * Redirect lands on `/auth/callback` where the session is exchanged, profile
 * identity is synced, and the user is routed to their destination. Supabase
 * creates the auth.users row on first OAuth sign-in; `handle_new_user()` runs
 * natively — this helper does not insert users or bypass that trigger.
 */
export async function handleSocialLogin(
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
      ...(provider === "google"
        ? { queryParams: { prompt: "select_account" } }
        : {}),
      ...(provider === "facebook" ? { scopes: "email public_profile" } : {}),
      ...(provider === "apple" ? { scopes: "email name" } : {}),
    },
  });

  if (error) {
    console.error(`${provider} login failed:`, error.message);
    return { error: mapOAuthStartError(error.message, provider) };
  }

  if (!data.url) {
    const message = `Unable to start ${PROVIDER_LABELS[provider]} sign-in. Confirm the provider is enabled in Supabase.`;
    console.error(`${provider} login failed:`, message);
    return { error: message };
  }

  window.location.assign(data.url);
  return {};
}

/** @deprecated Prefer `handleSocialLogin` — kept for existing imports. */
export const startOAuthSignIn = handleSocialLogin;
