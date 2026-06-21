"use client";

import Link from "next/link";
import {
  ArrowRight,
  Camera,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Upload,
  User,
} from "lucide-react";
import {
  CREATE_ACCOUNT_BAKED_FORM_MASK,
  CREATE_ACCOUNT_FORM_PANEL,
  type CreateAccountOverlayRect,
} from "@/lib/auth/create-account-slots";
import type { CreateAccountFormValues } from "@/lib/auth/create-account-validation";
import { US_STATES } from "@/lib/auth/us-states";
import type { CSSProperties } from "react";

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

function panelStyle(rect: CreateAccountOverlayRect): CSSProperties {
  return {
    position: "absolute",
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
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
  const avatarLabel = values.avatarFile?.name ?? "No photo selected";

  return (
    <div
      className="create-account-overlay pointer-events-none absolute inset-0 z-2 size-full"
      style={
        {
          "--create-account-mask-top": CREATE_ACCOUNT_BAKED_FORM_MASK.top,
          "--create-account-mask-height": CREATE_ACCOUNT_BAKED_FORM_MASK.height,
        } as CSSProperties
      }
    >
      <div className="create-account-overlay__baked-mask" aria-hidden="true" />

      <form
        onSubmit={onSubmit}
        className="auth-plate-form create-account-form pointer-events-auto"
        style={panelStyle(CREATE_ACCOUNT_FORM_PANEL)}
        aria-label="Create account"
        noValidate
      >
        <div className="create-account-form__row create-account-form__row--split">
          <label className="auth-plate-field">
            <User className="auth-plate-field__icon" aria-hidden="true" />
            <input
              type="text"
              required
              autoComplete="given-name"
              value={values.firstName}
              onChange={(event) => onFieldChange("firstName", event.target.value)}
              onBlur={onBlur}
              placeholder="First Name"
              aria-label="First name"
              className="auth-plate-field__control font-body"
            />
          </label>
          <label className="auth-plate-field">
            <User className="auth-plate-field__icon" aria-hidden="true" />
            <input
              type="text"
              required
              autoComplete="family-name"
              value={values.lastName}
              onChange={(event) => onFieldChange("lastName", event.target.value)}
              onBlur={onBlur}
              placeholder="Last Name"
              aria-label="Last name"
              className="auth-plate-field__control font-body"
            />
          </label>
        </div>

        <label className="auth-plate-field">
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

        <label className="auth-plate-field">
          <Phone className="auth-plate-field__icon" aria-hidden="true" />
          <input
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            value={values.phone}
            onChange={(event) => onFieldChange("phone", event.target.value)}
            onBlur={onBlur}
            placeholder="Phone Number"
            aria-label="Phone number"
            className="auth-plate-field__control font-body"
          />
        </label>

        <div className="create-account-form__row create-account-form__row--split">
          <label className="auth-plate-field">
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
          <label className="auth-plate-field create-account-field--select-wrap">
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
        </div>

        <label className="auth-plate-field auth-plate-field--password create-account-field--password">
          <Lock className="auth-plate-field__icon" aria-hidden="true" />
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            value={values.password}
            onChange={(event) => onFieldChange("password", event.target.value)}
            onBlur={onBlur}
            placeholder="Password"
            aria-label="Password"
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

        <label className="auth-plate-field auth-plate-field--password create-account-field--password">
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

        <div className="create-account-avatar-panel">
          <div className="create-account-avatar-panel__orb" aria-hidden="true">
            <Camera className="create-account-avatar-panel__orb-icon" />
          </div>
          <div className="create-account-avatar-panel__copy">
            <p className="create-account-avatar-panel__title font-ui">Upload Photo (Optional)</p>
            <p className="create-account-avatar-panel__hint font-body">
              Add a profile photo to personalize your experience.
            </p>
            <p className="create-account-avatar-panel__filename font-body">{avatarLabel}</p>
            <button
              type="button"
              className="create-account-avatar-panel__btn touch-target font-ui"
              onClick={onAvatarPick}
            >
              <Upload className="size-4" aria-hidden="true" />
              Choose Photo
            </button>
          </div>
        </div>

        <label className="create-account-terms touch-target font-body">
          <input
            type="checkbox"
            checked={values.acceptedTerms}
            onChange={(event) => onFieldChange("acceptedTerms", event.target.checked)}
            onBlur={onBlur}
            required
            className="create-account-terms__checkbox"
          />
          <span>
            I agree to the{" "}
            <span className="text-brand-blue">Terms of Service</span> and{" "}
            <span className="text-brand-pink">Privacy Policy</span>.
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting || !canSubmit}
          className="auth-plate-submit touch-target font-ui"
        >
          {isSubmitting ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <>
              <Lock className="auth-plate-submit__icon" aria-hidden="true" />
              <span>Create Account</span>
              <ArrowRight className="auth-plate-submit__icon" aria-hidden="true" />
            </>
          )}
        </button>

        {formError ? (
          <p role="alert" className="auth-plate-form-error font-body">
            {formError}
          </p>
        ) : null}

        <p className="auth-plate-footer-prompt font-body">
          Already have an account?{" "}
          <Link href={loginHref} className="auth-plate-footer-prompt__link font-ui">
            Log In
          </Link>
        </p>
      </form>
    </div>
  );
}
