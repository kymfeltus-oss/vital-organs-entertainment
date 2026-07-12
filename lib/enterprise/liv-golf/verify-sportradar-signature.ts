import { createHmac, timingSafeEqual } from "crypto";

export type SportradarSignatureResult =
  | { ok: true }
  | { ok: false; status: 401 | 500; error: string };

function safeEqualHex(expected: string, received: string): boolean {
  try {
    const expectedBuffer = Buffer.from(expected, "utf8");
    const receivedBuffer = Buffer.from(received, "utf8");
    if (expectedBuffer.length !== receivedBuffer.length) return false;
    return timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}

/** Verify Sportradar HMAC-SHA256 signature over the raw webhook body. */
export function verifySportradarWebhookSignature(
  request: Request,
  rawBody: string,
): SportradarSignatureResult {
  const secretKey = process.env.SPORTRADAR_SIGNATURE_KEY?.trim();

  if (!secretKey) {
    return {
      ok: false,
      status: 500,
      error: "Configuration Error: Signing key missing.",
    };
  }

  const signature = request.headers.get("X-Sportradar-Signature")?.trim();
  if (!signature) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized: Invalid signature packet.",
    };
  }

  const computedHash = createHmac("sha256", secretKey).update(rawBody).digest("hex");

  if (!safeEqualHex(computedHash, signature)) {
    // Dev fallback: shared static header when LIV_ODDS_WEBHOOK_SECRET is configured.
    const devSecret = process.env.LIV_ODDS_WEBHOOK_SECRET?.trim();
    if (devSecret && safeEqualHex(devSecret, signature)) {
      return { ok: true };
    }

    return {
      ok: false,
      status: 401,
      error: "Unauthorized: Invalid signature packet.",
    };
  }

  return { ok: true };
}
