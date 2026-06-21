"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AWAKENING_AUTH_LOGIN_PANELS } from "@/lib/experience/awakening-auth-assets";
import { authRectStyle } from "@/lib/experience/auth-layout-slots";

type AttendeeAuthLoginMobileFormProps = {
  createAccountHref: string;
  email: string;
  password: string;
  showPassword: boolean;
  rememberMe: boolean;
  isSubmitting: boolean;
  formError?: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onEmailBlur: () => void;
  onToggleShowPassword: () => void;
  onRememberMeChange: (checked: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export default function AttendeeAuthLoginMobileForm({
  createAccountHref,
  email,
  password,
  showPassword,
  rememberMe,
  isSubmitting,
  formError,
  onEmailChange,
  onPasswordChange,
  onEmailBlur,
  onToggleShowPassword,
  onRememberMeChange,
  onSubmit,
}: AttendeeAuthLoginMobileFormProps) {
  const panels = AWAKENING_AUTH_LOGIN_PANELS;

  return (
    <form
      onSubmit={onSubmit}
      className="auth-attendee-overlay-form"
      aria-label="Log in"
      noValidate
    >
      <input
        id="auth-login-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        enterKeyHint="next"
        disabled={isSubmitting}
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        onBlur={onEmailBlur}
        placeholder="Email Address"
        aria-label="Email address"
        className="auth-attendee-field touch-target"
        style={authRectStyle(panels.email)}
      />

      <input
        id="auth-login-password"
        name="password"
        type={showPassword ? "text" : "password"}
        required
        minLength={8}
        autoComplete="current-password"
        enterKeyHint="done"
        disabled={isSubmitting}
        value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
        placeholder="Password"
        aria-label="Password"
        className="auth-attendee-field auth-attendee-field--password touch-target"
        style={authRectStyle(panels.password)}
      />

      <button
        type="button"
        aria-label={showPassword ? "Hide password" : "Show password"}
        className="auth-attendee-hit auth-attendee-password-toggle touch-target"
        style={authRectStyle({
          left: panels.password.left + panels.password.width - 10,
          top: panels.password.top,
          width: 9,
          height: panels.password.height,
        })}
        onClick={onToggleShowPassword}
      />

      <label
        className="auth-attendee-hit auth-attendee-remember touch-target"
        style={authRectStyle(panels.rememberMe)}
      >
        <input
          type="checkbox"
          checked={rememberMe}
          disabled={isSubmitting}
          onChange={(event) => onRememberMeChange(event.target.checked)}
          className="auth-attendee-checkbox"
        />
        <span className="sr-only">Remember me</span>
      </label>

      <button
        type="button"
        disabled={isSubmitting}
        aria-label="Forgot password — coming soon"
        className="auth-attendee-hit auth-attendee-forgot-hit touch-target"
        style={authRectStyle(panels.forgotPassword)}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        aria-label="Log in"
        className="auth-attendee-hit auth-attendee-action-hit touch-target"
        style={authRectStyle(panels.loginButton)}
      >
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin text-white" aria-hidden="true" />
        ) : null}
      </button>

      <button
        type="button"
        disabled={isSubmitting}
        aria-label="Continue with Apple — coming soon"
        className="auth-attendee-hit auth-attendee-link-hit touch-target"
        style={authRectStyle(panels.appleSignIn)}
      />

      <button
        type="button"
        disabled={isSubmitting}
        aria-label="Continue with Google — coming soon"
        className="auth-attendee-hit auth-attendee-link-hit touch-target"
        style={authRectStyle(panels.googleSignIn)}
      />

      <button
        type="button"
        disabled={isSubmitting}
        aria-label="Continue with Facebook — coming soon"
        className="auth-attendee-hit auth-attendee-link-hit touch-target"
        style={authRectStyle(panels.facebookSignIn)}
      />

      <Link
        href={createAccountHref}
        aria-label="Sign up"
        className="auth-attendee-hit auth-attendee-link-hit touch-target"
        style={authRectStyle(panels.signUpLink)}
      />

      {formError ? (
        <p role="alert" className="auth-attendee-error font-body">
          {formError}
        </p>
      ) : null}
    </form>
  );
}
