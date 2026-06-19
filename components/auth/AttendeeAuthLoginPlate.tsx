"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AWAKENING_AUTH_LOGIN_PANELS } from "@/lib/experience/awakening-auth-assets";
import { authRectStyle } from "@/lib/experience/auth-layout-slots";

type AttendeeAuthLoginPlateProps = {
  createAccountHref: string;
  email: string;
  password: string;
  showPassword: boolean;
  rememberMe: boolean;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onEmailBlur: () => void;
  onToggleShowPassword: () => void;
  onRememberMeChange: (checked: boolean) => void;
  onSubmit: (event: React.FormEvent) => void;
  onGuest: () => void;
};

export default function AttendeeAuthLoginPlate({
  createAccountHref,
  email,
  password,
  showPassword,
  rememberMe,
  isSubmitting,
  onEmailChange,
  onPasswordChange,
  onEmailBlur,
  onToggleShowPassword,
  onRememberMeChange,
  onSubmit,
  onGuest,
}: AttendeeAuthLoginPlateProps) {
  const loginPanels = AWAKENING_AUTH_LOGIN_PANELS;

  const submitCurrentForm = (form: HTMLFormElement | null) => {
    if (!form) return;
    if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
      return;
    }
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  };

  return (
    <form onSubmit={onSubmit} className="auth-attendee-overlay-form" aria-label="Log in">
      <input
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        onBlur={onEmailBlur}
        placeholder="Email or username"
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
        placeholder="Password"
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
      <Link
        href={createAccountHref}
        aria-label="Create account"
        className="auth-attendee-hit auth-attendee-action-hit"
        style={authRectStyle(loginPanels.createAccountButton)}
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
