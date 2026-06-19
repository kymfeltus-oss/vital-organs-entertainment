"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AWAKENING_AUTH_SIGNUP_PANELS } from "@/lib/experience/awakening-auth-assets";
import { authRectStyle } from "@/lib/experience/auth-layout-slots";
import { US_STATES } from "@/lib/auth/us-states";
import type { CreateAccountFormValues } from "@/lib/auth/create-account-validation";

type AttendeeAuthSignupPlateProps = {
  loginHref: string;
  values: CreateAccountFormValues;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isSubmitting: boolean;
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

export default function AttendeeAuthSignupPlate({
  loginHref,
  values,
  showPassword,
  showConfirmPassword,
  isSubmitting,
  onFieldChange,
  onBlur,
  onToggleShowPassword,
  onToggleShowConfirmPassword,
  onAvatarPick,
  onSubmit,
}: AttendeeAuthSignupPlateProps) {
  const panels = AWAKENING_AUTH_SIGNUP_PANELS;

  const submitCurrentForm = (form: HTMLFormElement | null) => {
    if (!form) return;
    if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
      return;
    }
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  };

  return (
    <form
      onSubmit={onSubmit}
      className="auth-attendee-overlay-form"
      aria-label="Create account"
      noValidate
    >
      <input
        type="text"
        required
        autoComplete="given-name"
        value={values.firstName}
        onChange={(event) => onFieldChange("firstName", event.target.value)}
        onBlur={onBlur}
        placeholder=" "
        aria-label="First name"
        className="auth-attendee-field"
        style={authRectStyle(panels.firstName)}
      />
      <input
        type="text"
        required
        autoComplete="family-name"
        value={values.lastName}
        onChange={(event) => onFieldChange("lastName", event.target.value)}
        onBlur={onBlur}
        placeholder=" "
        aria-label="Last name"
        className="auth-attendee-field"
        style={authRectStyle(panels.lastName)}
      />
      <input
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        value={values.email}
        onChange={(event) => onFieldChange("email", event.target.value)}
        onBlur={onBlur}
        placeholder=" "
        aria-label="Email address"
        className="auth-attendee-field"
        style={authRectStyle(panels.email)}
      />
      <input
        type="tel"
        required
        autoComplete="tel"
        inputMode="tel"
        value={values.phone}
        onChange={(event) => onFieldChange("phone", event.target.value)}
        onBlur={onBlur}
        placeholder=" "
        aria-label="Phone number"
        className="auth-attendee-field"
        style={authRectStyle(panels.phone)}
      />
      <input
        type="text"
        required
        autoComplete="address-level2"
        value={values.city}
        onChange={(event) => onFieldChange("city", event.target.value)}
        onBlur={onBlur}
        placeholder=" "
        aria-label="City"
        className="auth-attendee-field"
        style={authRectStyle(panels.city)}
      />
      <select
        required
        value={values.state}
        onChange={(event) => onFieldChange("state", event.target.value)}
        onBlur={onBlur}
        aria-label="State"
        className="auth-attendee-field auth-attendee-field--select"
        style={authRectStyle(panels.state)}
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
      <input
        type={showPassword ? "text" : "password"}
        required
        autoComplete="new-password"
        value={values.password}
        onChange={(event) => onFieldChange("password", event.target.value)}
        onBlur={onBlur}
        placeholder=" "
        aria-label="Password"
        className="auth-attendee-field auth-attendee-field--password"
        style={authRectStyle(panels.password)}
      />
      <button
        type="button"
        aria-label={showPassword ? "Hide password" : "Show password"}
        className="auth-attendee-hit auth-attendee-password-toggle"
        style={authRectStyle({
          left: panels.password.left + panels.password.width - 9,
          top: panels.password.top,
          width: 8,
          height: panels.password.height,
        })}
        onClick={onToggleShowPassword}
      />
      <input
        type={showConfirmPassword ? "text" : "password"}
        required
        autoComplete="new-password"
        value={values.confirmPassword}
        onChange={(event) => onFieldChange("confirmPassword", event.target.value)}
        onBlur={onBlur}
        placeholder=" "
        aria-label="Confirm password"
        className="auth-attendee-field auth-attendee-field--password"
        style={authRectStyle(panels.confirmPassword)}
      />
      <button
        type="button"
        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
        className="auth-attendee-hit auth-attendee-password-toggle"
        style={authRectStyle({
          left: panels.confirmPassword.left + panels.confirmPassword.width - 9,
          top: panels.confirmPassword.top,
          width: 8,
          height: panels.confirmPassword.height,
        })}
        onClick={onToggleShowConfirmPassword}
      />
      <label
        className="auth-attendee-hit auth-attendee-remember"
        style={authRectStyle(panels.termsCheckbox)}
      >
        <input
          type="checkbox"
          checked={values.acceptedTerms}
          onChange={(event) => onFieldChange("acceptedTerms", event.target.checked)}
          onBlur={onBlur}
          required
          className="auth-attendee-checkbox"
        />
        <span className="sr-only">Accept terms of service and privacy policy</span>
      </label>
      <button
        type="button"
        disabled={isSubmitting}
        aria-label="Create account"
        className="auth-attendee-hit auth-attendee-action-hit"
        style={authRectStyle(panels.submitButton)}
        onClick={(event) => submitCurrentForm(event.currentTarget.form)}
      >
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin text-white" aria-hidden="true" />
        ) : null}
      </button>
      <Link
        href={loginHref}
        aria-label="Back to login"
        className="auth-attendee-hit auth-attendee-link-hit"
        style={authRectStyle(panels.backToLogin)}
      />
      <button
        type="button"
        aria-label="Upload profile photo"
        className="auth-attendee-hit auth-attendee-link-hit"
        style={authRectStyle(panels.avatarUpload)}
        onClick={onAvatarPick}
      />
    </form>
  );
}
