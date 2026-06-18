"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  AWAKENING_AUTH_LOGIN_PANELS,
  AWAKENING_AUTH_SIGNUP_PANELS,
} from "@/lib/experience/awakening-auth-assets";
import { authRectStyle } from "@/lib/experience/auth-layout-slots";

type AttendeeAuthLoginPlateProps = {
  mode: "login" | "signup";
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  showPassword: boolean;
  rememberMe: boolean;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onEmailBlur: () => void;
  onToggleShowPassword: () => void;
  onRememberMeChange: (checked: boolean) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCreateAccount: () => void;
  onBackToLogin: () => void;
  onGuest: () => void;
};

export default function AttendeeAuthLoginPlate({
  mode,
  email,
  password,
  firstName,
  lastName,
  showPassword,
  rememberMe,
  isSubmitting,
  onEmailChange,
  onPasswordChange,
  onFirstNameChange,
  onLastNameChange,
  onEmailBlur,
  onToggleShowPassword,
  onRememberMeChange,
  onSubmit,
  onCreateAccount,
  onBackToLogin,
  onGuest,
}: AttendeeAuthLoginPlateProps) {
  const loginPanels = AWAKENING_AUTH_LOGIN_PANELS;
  const signupPanels = AWAKENING_AUTH_SIGNUP_PANELS;

  const submitCurrentForm = (form: HTMLFormElement | null) => {
    if (!form) return;
    if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
      return;
    }
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  };

  if (mode === "signup") {
    return (
      <form onSubmit={onSubmit} className="auth-attendee-overlay-form" aria-label="Create account">
        <input
          type="text"
          required
          autoComplete="given-name"
          value={firstName}
          onChange={(event) => onFirstNameChange(event.target.value)}
          placeholder=" "
          aria-label="First name"
          className="auth-attendee-field"
          style={authRectStyle(signupPanels.firstName)}
        />
        <input
          type="text"
          required
          autoComplete="family-name"
          value={lastName}
          onChange={(event) => onLastNameChange(event.target.value)}
          placeholder=" "
          aria-label="Last name"
          className="auth-attendee-field"
          style={authRectStyle(signupPanels.lastName)}
        />
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          onBlur={onEmailBlur}
          placeholder=" "
          aria-label="Email"
          className="auth-attendee-field"
          style={authRectStyle(signupPanels.email)}
        />
        <input
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder=" "
          aria-label="Password"
          className="auth-attendee-field auth-attendee-field--password"
          style={authRectStyle(signupPanels.password)}
        />
        <button
          type="button"
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="auth-attendee-hit auth-attendee-password-toggle"
          style={authRectStyle({
            left: signupPanels.password.left + signupPanels.password.width - 9,
            top: signupPanels.password.top,
            width: 8,
            height: signupPanels.password.height,
          })}
          onClick={onToggleShowPassword}
        />
        <button
          type="button"
          aria-label="Back to login"
          className="auth-attendee-hit auth-attendee-action-hit"
          style={authRectStyle(signupPanels.backToLogin)}
          onClick={onBackToLogin}
        />
        <button
          type="button"
          disabled={isSubmitting}
          aria-label="Create account"
          className="auth-attendee-hit auth-attendee-action-hit"
          style={authRectStyle(signupPanels.submitButton)}
          onClick={(event) => submitCurrentForm(event.currentTarget.form)}
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin text-white" aria-hidden="true" /> : null}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="auth-attendee-overlay-form" aria-label="Log in">
      <input
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        onBlur={onEmailBlur}
        placeholder=" "
        aria-label="Email or Username"
        className="auth-attendee-field"
        style={authRectStyle(loginPanels.email)}
      />
      <input
        type={showPassword ? "text" : "password"}
        required
        minLength={8}
        autoComplete="current-password"
        value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
        placeholder=" "
        aria-label="Password"
        className="auth-attendee-field auth-attendee-field--password"
        style={authRectStyle(loginPanels.password)}
      />
      <button
        type="button"
        aria-label={showPassword ? "Hide password" : "Show password"}
        className="auth-attendee-hit auth-attendee-password-toggle"
        style={authRectStyle({
          left: loginPanels.password.left + loginPanels.password.width - 9,
          top: loginPanels.password.top,
          width: 8,
          height: loginPanels.password.height,
        })}
        onClick={onToggleShowPassword}
      />
      <label
        className="auth-attendee-hit auth-attendee-remember"
        style={authRectStyle(loginPanels.rememberMe)}
      >
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(event) => onRememberMeChange(event.target.checked)}
          className="auth-attendee-checkbox"
        />
        <span className="sr-only">Remember me</span>
      </label>
      <button
        type="button"
        aria-label="Forgot password — coming soon"
        className="auth-attendee-hit auth-attendee-forgot-hit"
        style={authRectStyle(loginPanels.forgotPassword)}
        onClick={() => {
          /* Password reset will attach here in a later phase. */
        }}
      />
      <button
        type="button"
        disabled={isSubmitting}
        aria-label="Log in"
        className="auth-attendee-hit auth-attendee-action-hit"
        style={authRectStyle(loginPanels.loginButton)}
        onClick={(event) => submitCurrentForm(event.currentTarget.form)}
      >
        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin text-white" aria-hidden="true" /> : null}
      </button>
      <button
        type="button"
        aria-label="Create account"
        className="auth-attendee-hit auth-attendee-action-hit"
        style={authRectStyle(loginPanels.createAccountButton)}
        onClick={onCreateAccount}
      />
      <Link
        href="/experience/join-movement"
        className="auth-attendee-hit auth-attendee-link-hit"
        style={authRectStyle(loginPanels.joinMovement)}
        aria-label="Join the movement"
      />
      <button
        type="button"
        aria-label="Continue as guest"
        className="auth-attendee-hit auth-attendee-link-hit"
        style={authRectStyle(loginPanels.guestEntry)}
        onClick={onGuest}
      />
    </form>
  );
}
