type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
};

export type TurnstileVerifyResult = {
  ok: boolean;
  skipped: boolean;
  errorCodes: string[];
};

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function getTurnstileSecret(): string | null {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  return secret || null;
}

/** Verify Cloudflare Turnstile token server-side. Skips only in non-production when secret unset. */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string | null,
): Promise<TurnstileVerifyResult> {
  const secret = getTurnstileSecret();

  if (!secret) {
    if (isProduction()) {
      console.error("[AUTH_TURNSTILE_ERR]: TURNSTILE_SECRET_KEY missing in production.");
      return { ok: false, skipped: false, errorCodes: ["missing-secret"] };
    }

    return { ok: true, skipped: true, errorCodes: [] };
  }

  const trimmed = token?.trim() ?? "";
  if (!trimmed) {
    return { ok: false, skipped: false, errorCodes: ["missing-token"] };
  }

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", trimmed);
  if (remoteIp?.trim()) {
    form.set("remoteip", remoteIp.trim());
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      cache: "no-store",
    });

    if (!response.ok) {
      return { ok: false, skipped: false, errorCodes: ["verify-http-error"] };
    }

    const payload = (await response.json()) as TurnstileVerifyResponse;
    return {
      ok: payload.success === true,
      skipped: false,
      errorCodes: payload["error-codes"] ?? [],
    };
  } catch (error) {
    console.error("[AUTH_TURNSTILE_ERR]: verification request failed.", error);
    return { ok: false, skipped: false, errorCodes: ["verify-network-error"] };
  }
}
