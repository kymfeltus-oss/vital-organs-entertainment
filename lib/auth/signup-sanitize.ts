import { isValidEmail, isValidPhone, normalizePhoneDigits } from "@/lib/auth/validation";
import { isValidUsStateCode } from "@/lib/auth/us-states";

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const HTML_TAG = /<[^>]*>/g;

export const SIGNUP_FIELD_LIMITS = {
  firstName: 80,
  lastName: 80,
  email: 254,
  phone: 32,
  city: 120,
  state: 2,
  password: 128,
} as const;

export type SanitizedSignupPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  turnstileToken: string;
  next: string | null;
};

export type SignupSanitizeResult =
  | { ok: true; data: SanitizedSignupPayload }
  | { ok: false; error: string };

function stripUnsafeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(CONTROL_CHARS, "")
    .replace(HTML_TAG, "")
    .trim()
    .slice(0, maxLength);
}

function normalizeName(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function sanitizeSignupRequestBody(body: unknown): SignupSanitizeResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid registration payload." };
  }

  const record = body as Record<string, unknown>;

  const firstName = normalizeName(stripUnsafeText(record.firstName, SIGNUP_FIELD_LIMITS.firstName));
  const lastName = normalizeName(stripUnsafeText(record.lastName, SIGNUP_FIELD_LIMITS.lastName));
  const email = stripUnsafeText(record.email, SIGNUP_FIELD_LIMITS.email).toLowerCase();
  const phone = normalizePhoneDigits(stripUnsafeText(record.phone, SIGNUP_FIELD_LIMITS.phone));
  const city = stripUnsafeText(record.city, SIGNUP_FIELD_LIMITS.city);
  const state = stripUnsafeText(record.state, SIGNUP_FIELD_LIMITS.state).toUpperCase();
  const password = typeof record.password === "string" ? record.password.slice(0, SIGNUP_FIELD_LIMITS.password) : "";
  const confirmPassword =
    typeof record.confirmPassword === "string"
      ? record.confirmPassword.slice(0, SIGNUP_FIELD_LIMITS.password)
      : password;
  const turnstileToken = stripUnsafeText(record.turnstileToken, 4096);
  const next = stripUnsafeText(record.next, 512) || null;

  if (!firstName || !lastName) {
    return { ok: false, error: "First and last name are required." };
  }

  if (!email || !isValidEmail(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  if (phone && !isValidPhone(phone)) {
    return { ok: false, error: "Enter a valid 10-digit US phone number." };
  }

  if (!city) {
    return { ok: false, error: "City is required." };
  }

  if (!state || !isValidUsStateCode(state)) {
    return { ok: false, error: "A valid US state is required." };
  }

  if (!password) {
    return { ok: false, error: "Password is required." };
  }

  if (password !== confirmPassword) {
    return { ok: false, error: "Passwords do not match." };
  }

  if (record.acceptedTerms !== true) {
    return { ok: false, error: "You must accept the Terms of Service." };
  }

  if (record.acceptedPrivacy !== true) {
    return { ok: false, error: "You must accept the Privacy Policy." };
  }

  return {
    ok: true,
    data: {
      firstName,
      lastName,
      email,
      phone,
      city,
      state,
      password,
      confirmPassword,
      acceptedTerms: true,
      acceptedPrivacy: true,
      turnstileToken,
      next,
    },
  };
}
