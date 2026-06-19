"use client";

import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";

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
  return (
    <div className="auth-login-page w-full max-w-[min(100%,24rem)] px-5 py-8 text-center">
      <p className="auth-login-page__eyebrow font-ui text-[0.62rem] font-bold uppercase tracking-[0.28em]">
        Live · Empower · Transform
      </p>

      <h1 className="auth-login-page__title mt-8 font-headline text-fluid-section uppercase tracking-[0.12em] text-white">
        Welcome Back
      </h1>
      <p className="auth-login-page__subtitle mt-2 font-body text-sm text-brand-muted">
        Log in to continue your journey.
      </p>

      <form
        onSubmit={onSubmit}
        className="auth-login-page__form mt-8 text-left"
        aria-label="Log in"
      >
        <div className="auth-login-page__field">
          <label htmlFor="auth-login-email" className="sr-only">
            Email address
          </label>
          <User
            className="auth-login-page__field-icon text-brand-blue"
            aria-hidden="true"
            strokeWidth={2}
          />
          <input
            id="auth-login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            onBlur={onEmailBlur}
            placeholder="Email address"
            className="auth-login-page__input font-body"
          />
        </div>

        <div className="auth-login-page__field">
          <label htmlFor="auth-login-password" className="sr-only">
            Password
          </label>
          <Lock
            className="auth-login-page__field-icon text-brand-pink"
            aria-hidden="true"
            strokeWidth={2}
          />
          <input
            id="auth-login-password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="current-password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="Password"
            className="auth-login-page__input auth-login-page__input--password font-body"
          />
          <button
            type="button"
            className="auth-login-page__password-toggle touch-target"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={onToggleShowPassword}
          >
            {showPassword ? (
              <EyeOff className="h-[1.125rem] w-[1.125rem] text-brand-muted" aria-hidden="true" />
            ) : (
              <Eye className="h-[1.125rem] w-[1.125rem] text-brand-muted" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="auth-login-page__options">
          <label className="auth-login-page__remember font-ui text-[0.78rem] text-brand-muted">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => onRememberMeChange(event.target.checked)}
              className="auth-login-page__checkbox"
            />
            Remember me
          </label>
          <button
            type="button"
            className="auth-login-page__forgot font-ui text-[0.78rem] font-semibold text-brand-pink transition hover:opacity-80"
            aria-label="Forgot password — coming soon"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="auth-login-page__submit touch-target font-ui text-[0.72rem] font-bold uppercase tracking-[0.18em]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              <span className="sr-only">Signing in</span>
            </>
          ) : (
            "Log In"
          )}
        </button>
      </form>

      <div className="auth-login-page__links mt-6 flex flex-col gap-3">
        <Link
          href={createAccountHref}
          className="auth-login-page__secondary-link touch-target font-ui text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand-blue"
        >
          Create account
        </Link>
        <Link
          href="/experience/join-movement"
          className="auth-login-page__secondary-link touch-target font-ui text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-brand-muted transition hover:text-white"
        >
          Join the movement
        </Link>
        <button
          type="button"
          onClick={onGuest}
          className="auth-login-page__secondary-link touch-target font-ui text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-brand-muted transition hover:text-white"
        >
          Continue as guest
        </button>
      </div>
    </div>
  );
}
