/** Client-safe OAuth setup hints — provider secrets live in Supabase Auth, not `.env`. */

export const OAUTH_CALLBACK_PATH = "/auth/callback";

/** Ops checklist when a provider returns "not enabled" from Supabase. */
export const OAUTH_PROVIDER_SETUP_TODOS: Record<"apple" | "google" | "facebook", string> = {
  google:
    "TODO (ops): Supabase Dashboard → Authentication → Providers → Google — enable, add OAuth Client ID/secret from Google Cloud Console, authorized redirect URI https://<project-ref>.supabase.co/auth/v1/callback",
  apple:
    "TODO (ops): Supabase Dashboard → Authentication → Providers → Apple — enable, add Services ID, team/key IDs, and redirect URI https://<project-ref>.supabase.co/auth/v1/callback",
  facebook:
    "TODO (ops): Supabase Dashboard → Authentication → Providers → Facebook — enable with Meta App ID/secret (not the streaming FACEBOOK_CLIENT_ID used for Restream OAuth)",
};

export type OAuthClientSetupResult =
  | { ok: true }
  | { ok: false; message: string };

/** Validates public Supabase env required before `signInWithOAuth`. */
export function validateOAuthClientSetup(): OAuthClientSetupResult {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url) {
    return {
      ok: false,
      message:
        "Social sign-in is unavailable: NEXT_PUBLIC_SUPABASE_URL is missing. Add it to .env.local and restart the dev server.",
    };
  }

  if (!key || key.includes("your-anon") || key.includes("yourActual")) {
    return {
      ok: false,
      message:
        "Social sign-in is unavailable: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or still a placeholder. Add your Supabase anon key to .env.local.",
    };
  }

  return { ok: true };
}

export function buildOAuthRedirectAllowlistHint(): string {
  if (typeof window === "undefined") return OAUTH_CALLBACK_PATH;
  return `${window.location.origin}${OAUTH_CALLBACK_PATH}`;
}
