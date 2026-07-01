import {
  evaluatePasswordStrength,
  PASSWORD_MIN_LENGTH,
} from "@/lib/auth/password-policy";
import { isValidEmail } from "@/lib/auth/validation";

/** @deprecated Import PASSWORD_MIN_LENGTH from password-policy — kept for compatibility. */
export const CREATE_ACCOUNT_MIN_PASSWORD_LENGTH = PASSWORD_MIN_LENGTH;

export { PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy";

export const CREATE_ACCOUNT_TERMS_URL =
  process.env.NEXT_PUBLIC_TERMS_URL?.trim() || "/contact-us";

export const CREATE_ACCOUNT_PRIVACY_URL =
  process.env.NEXT_PUBLIC_PRIVACY_URL?.trim() || "/contact-us";

export type CreateAccountFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
};

export type CreateAccountFieldErrors = Partial<
  Record<
    | "firstName"
    | "lastName"
    | "email"
    | "password"
    | "confirmPassword"
    | "acceptedTerms"
    | "acceptedPrivacy",
    string
  >
>;

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function validateCreateAccountForm(
  values: CreateAccountFormValues,
): CreateAccountFieldErrors {
  const errors: CreateAccountFieldErrors = {};

  if (!normalizeName(values.firstName)) {
    errors.firstName = "First name is required.";
  }

  if (!normalizeName(values.lastName)) {
    errors.lastName = "Last name is required.";
  }

  const normalizedEmail = values.email.trim().toLowerCase();

  if (!normalizedEmail) {
    errors.email = "Email address is required.";
  } else if (!isValidEmail(normalizedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else {
    const strength = evaluatePasswordStrength(values.password);
    if (!strength.isValid) {
      errors.password = strength.message ?? "Password does not meet security requirements.";
    }
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!values.acceptedTerms) {
    errors.acceptedTerms = "You must accept the Terms of Service.";
  }

  if (!values.acceptedPrivacy) {
    errors.acceptedPrivacy = "You must accept the Privacy Policy.";
  }

  return errors;
}

export function isCreateAccountFormValid(values: CreateAccountFormValues): boolean {
  return Object.keys(validateCreateAccountForm(values)).length === 0;
}

export function formatFullName(values: Pick<CreateAccountFormValues, "firstName" | "lastName">): string {
  return [normalizeName(values.firstName), normalizeName(values.lastName)].filter(Boolean).join(" ");
}

export function applyFullNameInput(
  fullName: string,
): Pick<CreateAccountFormValues, "firstName" | "lastName"> {
  const normalized = normalizeName(fullName);
  if (!normalized) return { firstName: "", lastName: "" };
  const parts = normalized.split(" ");
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function resolveCreateAccountProfileInitial(
  firstName: string,
  lastName = "",
): string {
  const firstInitial = normalizeName(firstName).charAt(0).toUpperCase();
  const lastInitial = normalizeName(lastName).charAt(0).toUpperCase();

  if (firstInitial && lastInitial) {
    return `${firstInitial}${lastInitial}`;
  }

  if (firstInitial) {
    return firstInitial;
  }

  if (lastInitial) {
    return lastInitial;
  }

  return "?";
}

export function serializeCreateAccountPayload(values: CreateAccountFormValues) {
  const firstName = normalizeName(values.firstName);
  const lastName = normalizeName(values.lastName);

  return {
    firstName,
    lastName,
    email: values.email.trim().toLowerCase(),
    password: values.password,
    confirmPassword: values.confirmPassword,
    acceptedTerms: values.acceptedTerms,
    acceptedPrivacy: values.acceptedPrivacy,
  };
}
