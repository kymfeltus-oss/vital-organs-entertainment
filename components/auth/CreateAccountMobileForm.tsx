"use client";

import Link from "next/link";
import { ChevronDown, Eye, EyeOff, Loader2, Lock, Mail, MapPin, User } from "lucide-react";
import {
  CREATE_ACCOUNT_BAKED_FIELD_MASKS,
  CREATE_ACCOUNT_FIELD_SLOTS,
  type CreateAccountOverlayRect,
} from "@/lib/auth/create-account-slots";
import {
  applyFullNameInput,
  formatFullName,
  type CreateAccountFormValues,
} from "@/lib/auth/create-account-validation";
import { US_STATES } from "@/lib/auth/us-states";
import type { CSSProperties, ReactNode } from "react";

type CreateAccountMobileFormProps = {
  loginHref: string;
  values: CreateAccountFormValues;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  formError?: string | null;
  onFieldChange: <K extends keyof CreateAccountFormValues>(
    key: K,
    value: CreateAccountFormValues[K],
  ) => void;
  onBlur: () => void;
  onToggleShowPassword: () => void;
  onToggleShowConfirmPassword: () => void;
  onAvatarPick: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

function slotStyle(rect: CreateAccountOverlayRect): CSSProperties {
  return {
    position: "absolute",
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

function FormSlot({
  rect,
  className,
  children,
}: {
  rect: CreateAccountOverlayRect;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={["create-account-form__slot", className].filter(Boolean).join(" ")} style={slotStyle(rect)}>
      {children}
    </div>
  );
}

export default function CreateAccountMobileForm({
  loginHref,
  values,
  showPassword,
  showConfirmPassword,
  isSubmitting,
  canSubmit,
  formError,
  onFieldChange,
  onBlur,
  onToggleShowPassword,
  onToggleShowConfirmPassword,
  onAvatarPick,
  onSubmit,
}: CreateAccountMobileFormProps) {
  const fullName = formatFullName(values);

  return (
    <div className="create-account-overlay pointer-events-none absolute inset-0 z-2 size-full">
      {CREATE_ACCOUNT_BAKED_FIELD_MASKS.map((rect, index) => (
        <div
          key={`create-account-field-mask-${index}`}
          className="create-account-overlay__field-mask"
          style={slotStyle(rect)}
          aria-hidden="true"
        />
      ))}

      <form
        onSubmit={onSubmit}
        className="auth-plate-form create-account-form pointer-events-auto"
        aria-label="Create account"
        noValidate
      >
        <FormSlot rect={CREATE_ACCOUNT_FIELD_SLOTS.avatar}>
          <button
            type="button"
            className="create-account-avatar-hit touch-target size-full"
            aria-label="Upload profile photo"
            disabled={isSubmitting}
            onClick={onAvatarPick}
          />
        </FormSlot>

        <FormSlot rect={CREATE_ACCOUNT_FIELD_SLOTS.fullName}>
          <label className="auth-plate-field create-account-form__field">
            <User className="auth-plate-field__icon" aria-hidden="true" />
            <input
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(event) => {
                const parsed = applyFullNameInput(event.target.value);
                onFieldChange("firstName", parsed.firstName);
                onFieldChange("lastName", parsed.lastName);
              }}
              onBlur={onBlur}
              placeholder="Full Name"
              aria-label="Full name"
              className="auth-plate-field__control font-body"
            />
          </label>
        </FormSlot>

        <FormSlot rect={CREATE_ACCOUNT_FIELD_SLOTS.email}>
          <label className="auth-plate-field create-account-form__field">
            <Mail className="auth-plate-field__icon" aria-hidden="true" />
            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={values.email}
              onChange={(event) => onFieldChange("email", event.target.value)}
              onBlur={onBlur}
              placeholder="Email Address"
              aria-label="Email address"
              className="auth-plate-field__control font-body"
            />
          </label>
        </FormSlot>

        <FormSlot rect={CREATE_ACCOUNT_FIELD_SLOTS.city}>
          <label className="auth-plate-field create-account-form__field">
            <MapPin className="auth-plate-field__icon" aria-hidden="true" />
            <input
              type="text"
              required
              autoComplete="address-level2"
              value={values.city}
              onChange={(event) => onFieldChange("city", event.target.value)}
              onBlur={onBlur}
              placeholder="City"
              aria-label="City"
              className="auth-plate-field__control font-body"
            />
          </label>
        </FormSlot>

        <FormSlot rect={CREATE_ACCOUNT_FIELD_SLOTS.state}>
          <label className="auth-plate-field create-account-form__field create-account-field--select-wrap">
            <MapPin className="auth-plate-field__icon" aria-hidden="true" />
            <select
              required
              value={values.state}
              onChange={(event) => onFieldChange("state", event.target.value)}
              onBlur={onBlur}
              aria-label="State"
              className="auth-plate-field__control create-account-field__control--select font-body"
            >
              <option value="" disabled>
                State
              </option>
              {US_STATES.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </select>
            <ChevronDown className="create-account-field__chevron" aria-hidden="true" />
          </label>
        </FormSlot>

        <FormSlot rect={CREATE_ACCOUNT_FIELD_SLOTS.password}>
          <label className="auth-plate-field auth-plate-field--password create-account-form__field create-account-field--password">
            <Lock className="auth-plate-field__icon" aria-hidden="true" />
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => onFieldChange("password", event.target.value)}
              onBlur={onBlur}
              placeholder="Create Password"
              aria-label="Create password"
              className="auth-plate-field__control font-body"
            />
            <button
              type="button"
              className="auth-plate-field__toggle touch-target"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={onToggleShowPassword}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </label>
        </FormSlot>

        <FormSlot rect={CREATE_ACCOUNT_FIELD_SLOTS.confirmPassword}>
          <label className="auth-plate-field auth-plate-field--password create-account-form__field create-account-field--password">
            <Lock className="auth-plate-field__icon" aria-hidden="true" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={(event) => onFieldChange("confirmPassword", event.target.value)}
              onBlur={onBlur}
              placeholder="Confirm Password"
              aria-label="Confirm password"
              className="auth-plate-field__control font-body"
            />
            <button
              type="button"
              className="auth-plate-field__toggle touch-target"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              onClick={onToggleShowConfirmPassword}
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </label>
        </FormSlot>

        <FormSlot rect={CREATE_ACCOUNT_FIELD_SLOTS.terms}>
          <label className="create-account-terms create-account-form__field touch-target font-body">
            <input
              type="checkbox"
              checked={values.acceptedTerms}
              onChange={(event) => onFieldChange("acceptedTerms", event.target.checked)}
              onBlur={onBlur}
              required
              className="create-account-terms__checkbox"
            />
            <span className="create-account-terms__copy">
              I agree to the{" "}
              <span className="text-brand-blue">Terms of Service</span> and{" "}
              <span className="text-brand-pink">Privacy Policy</span>.
            </span>
          </label>
        </FormSlot>

        <FormSlot rect={CREATE_ACCOUNT_FIELD_SLOTS.submit}>
          <button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className="auth-plate-submit create-account-form__field touch-target font-ui size-full"
          >
            {isSubmitting ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </FormSlot>

        {formError ? (
          <p role="alert" className="auth-plate-form-error font-body">
            {formError}
          </p>
        ) : null}

        <FormSlot rect={CREATE_ACCOUNT_FIELD_SLOTS.loginLink}>
          <p className="auth-plate-footer-prompt create-account-form__field font-body">
            Already have an account?{" "}
            <Link href={loginHref} className="auth-plate-footer-prompt__link font-ui">
              Log In
            </Link>
          </p>
        </FormSlot>
      </form>
    </div>
  );
}
