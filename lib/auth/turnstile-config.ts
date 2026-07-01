/** Shared Turnstile configuration — enforce CAPTCHA only when both keys are present. */

/** Internal token used when Turnstile is not configured (never sent to Cloudflare). */
export const TURNSTILE_BYPASS_TOKEN = "turnstile-unconfigured-bypass";

export function getTurnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
}

export function getTurnstileSecretKey(): string {
  return process.env.TURNSTILE_SECRET_KEY?.trim() ?? "";
}

/** True when the signup form should render the Turnstile widget (site key present). */
export function isTurnstileWidgetEnabled(): boolean {
  return Boolean(getTurnstileSiteKey());
}

/** True when server-side Turnstile verification must run (both keys present). */
export function isTurnstileEnforced(): boolean {
  return Boolean(getTurnstileSiteKey() && getTurnstileSecretKey());
}

export function isTurnstileBypassToken(token: string | null | undefined): boolean {
  return token?.trim() === TURNSTILE_BYPASS_TOKEN;
}
