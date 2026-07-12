import { createHmac, timingSafeEqual } from "crypto";

export type SportradarSignatureResult =
  | { ok: true; mode: "dev-bypass" | "hmac" }
  | { ok: false; status: 401 | 500; error: string };

function safeEqualString(expected: string, received: string): boolean {
  try {
    const expectedBuffer = Buffer.from(expected, "utf8");
    const receivedBuffer = Buffer.from(received, "utf8");
    if (expectedBuffer.length !== receivedBuffer.length) return false;
    return timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}

/** Verify Sportradar HMAC-SHA256 signature with local dev static-key bypass support. */
export function verifySportradarWebhookSignature(
  request: Request,
  rawBody: string,
): SportradarSignatureResult {
  const signature = request.headers.get("X-Sportradar-Signature")?.trim();
  const secretKey = process.env.SPORTRADAR_SIGNATURE_KEY?.trim();
  const devFallbackSecret = process.env.LIV_ODDS_WEBHOOK_SECRET?.trim();

  if (!secretKey && !devFallbackSecret) {
    return {
      ok: false,
      status: 500,
      error: "Configuration Error: Security signing keys missing entirely.",
    };
  }

  if (!signature) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized: Cryptographic signature mismatch.",
    };
  }

  const isDevTestBypass = Boolean(devFallbackSecret && safeEqualString(devFallbackSecret, signature));
  if (isDevTestBypass) {
    return { ok: true, mode: "dev-bypass" };
  }

  const computedHash = createHmac("sha256", secretKey || "")
    .update(rawBody)
    .digest("hex");

  if (!safeEqualString(computedHash, signature)) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized: Cryptographic signature mismatch.",
    };
  }

  return { ok: true, mode: "hmac" };
}
