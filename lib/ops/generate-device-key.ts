import crypto from "crypto";

const OPERATOR_SLUG_PATTERN = /^[a-z0-9_]{2,32}$/;

function sanitizeOperatorSlug(operatorName: string): string {
  const normalized = operatorName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);

  if (OPERATOR_SLUG_PATTERN.test(normalized)) return normalized;
  return "phone_guy";
}

/**
 * Creates a unique, secure stream key for mobile phone camera inputs.
 * Example output: awakening_cam_operator_a7b2c9d4
 */
export function generateDeviceStreamKey(operatorName: string = "phone_guy"): string {
  const slug = sanitizeOperatorSlug(operatorName);
  const randomToken = crypto.randomBytes(4).toString("hex");
  return `awakening_${slug}_${randomToken}`;
}
