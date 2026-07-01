/** Shared password policy — enforced client-side and server-side before Supabase Auth signUp. */

export const PASSWORD_MIN_LENGTH = 10;

export type PasswordStrengthCheckId =
  | "length"
  | "lowercase"
  | "uppercase"
  | "number"
  | "symbol";

export type PasswordStrengthCheck = {
  id: PasswordStrengthCheckId;
  label: string;
  passed: boolean;
};

export type PasswordStrengthResult = {
  score: number;
  maxScore: number;
  isValid: boolean;
  checks: PasswordStrengthCheck[];
  message: string | null;
};

const SYMBOL_PATTERN = /[^A-Za-z0-9]/;

function buildChecks(password: string): PasswordStrengthCheck[] {
  return [
    {
      id: "length",
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      passed: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      id: "lowercase",
      label: "One lowercase letter",
      passed: /[a-z]/.test(password),
    },
    {
      id: "uppercase",
      label: "One uppercase letter",
      passed: /[A-Z]/.test(password),
    },
    {
      id: "number",
      label: "One number",
      passed: /\d/.test(password),
    },
    {
      id: "symbol",
      label: "One symbol",
      passed: SYMBOL_PATTERN.test(password),
    },
  ];
}

/** Evaluate password strength for live UI feedback and server validation. */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const checks = buildChecks(password);
  const score = checks.filter((check) => check.passed).length;
  const isValid = checks.every((check) => check.passed);

  return {
    score,
    maxScore: checks.length,
    isValid,
    checks,
    message: isValid
      ? null
      : "Password must meet all security requirements below.",
  };
}

/** @deprecated Use PASSWORD_MIN_LENGTH — kept for import compatibility. */
export const CREATE_ACCOUNT_MIN_PASSWORD_LENGTH = PASSWORD_MIN_LENGTH;
