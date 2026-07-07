"use client";

import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import TenantAuthCallout from "@/components/features/auth/TenantAuthCallout";
import BrandLogo from "@/components/ui/layout/BrandLogo";
import PageContainer from "@/components/ui/layout/PageContainer";

type AttendeeAuthLoginPlateProps = {
  createAccountHref: string;
  forgotPasswordHref: string;
  email: string;
  password: string;
  showPassword: boolean;
  rememberMe: boolean;
  isSubmitting: boolean;
  formError?: string | null;
  formNotice?: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onEmailBlur: () => void;
  onToggleShowPassword: () => void;
  onRememberMeChange: (checked: boolean) => void;
  onSubmit: (event: React.FormEvent) => void;
};

const inputClassName =
  "w-full rounded-xl border border-brand-border bg-brand-panel/80 py-3 font-body text-sm text-white outline-none transition placeholder:text-brand-muted/45 focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/25 disabled:opacity-60";

export default function AttendeeAuthLoginPlate({
  createAccountHref,
  forgotPasswordHref,
  email,
  password,
  showPassword,
  rememberMe,
  isSubmitting,
  formError,
  formNotice,
  onEmailChange,
  onPasswordChange,
  onEmailBlur,
  onToggleShowPassword,
  onRememberMeChange,
  onSubmit,
}: AttendeeAuthLoginPlateProps) {
  const displayMessage = formError ?? formNotice;
  const messageIsError = Boolean(formError);

  return (
    <div
      className="flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto py-8 pt-safe pb-safe sm:py-12"
      style={{ background: "var(--theme-app-gradient)" }}
    >
      <PageContainer maxWidth="sm" className="py-0">
        <header className="mb-8 text-center">
          <div className="flex justify-center">
            <BrandLogo size="lg" />
          </div>
          <h1
            className="mt-6 text-[clamp(1.75rem,7vw,2.5rem)] font-semibold leading-none"
            style={{ fontFamily: "var(--theme-font-headline)", color: "var(--theme-text)" }}
          >
            Welcome Back
          </h1>
          <p
            className="mx-auto mt-3 max-w-[18rem] text-sm leading-relaxed"
            style={{ color: "var(--theme-text-muted)" }}
          >
            Sign in to pick up your journey where you left off.
          </p>
        </header>

        <div className="glass-panel rounded-[1.25rem] p-5 sm:p-7">
          <form onSubmit={onSubmit} aria-label="Log in" autoComplete="on" noValidate className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block font-ui text-[0.62rem] font-bold uppercase tracking-[0.18em] text-brand-muted">
                Email
              </span>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-blue"
                  aria-hidden="true"
                />
                <input
                  id="auth-login-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  disabled={isSubmitting}
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  onBlur={onEmailBlur}
                  placeholder="you@example.com"
                  className={`${inputClassName} pl-10`}
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block font-ui text-[0.62rem] font-bold uppercase tracking-[0.18em] text-brand-muted">
                Password
              </span>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-pink"
                  aria-hidden="true"
                />
                <input
                  id="auth-login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder="Enter your password"
                  className={`${inputClassName} pl-10 pr-11`}
                />
                <button
                  type="button"
                  className="touch-target absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-brand-muted transition hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isSubmitting}
                  onClick={onToggleShowPassword}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between gap-3 pt-1">
              <label className="inline-flex cursor-pointer items-center gap-2.5 font-ui text-xs text-brand-muted">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  disabled={isSubmitting}
                  onChange={(event) => onRememberMeChange(event.target.checked)}
                  className="auth-login-page__checkbox size-4 rounded border-brand-border bg-brand-panel accent-brand-blue"
                />
                Remember me
              </label>
              <Link
                href={forgotPasswordHref}
                className="font-ui text-xs font-semibold text-brand-pink transition hover:opacity-80"
              >
                Forgot password?
              </Link>
            </div>

            {displayMessage ? (
              <p
                role={messageIsError ? "alert" : "status"}
                className={
                  messageIsError
                    ? "rounded-lg border border-brand-pink/30 bg-brand-pink/10 px-3 py-2 font-body text-sm text-brand-pink"
                    : "rounded-lg border border-brand-blue/30 bg-brand-blue/10 px-3 py-2 font-body text-sm text-brand-blue"
                }
              >
                {displayMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="touch-target mt-1 inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl border border-brand-blue/45 bg-brand-blue/12 px-6 font-ui text-[0.68rem] font-bold uppercase tracking-[0.16em] text-brand-blue transition hover:bg-brand-blue/20 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                <>
                  Log In
                  <ArrowRight className="size-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <TenantAuthCallout variant="login" />
        </div>

        <div className="mt-6 space-y-3 text-center">
          <p className="font-body text-sm text-brand-muted">
            Don&apos;t have an account?{" "}
            <Link
              href={createAccountHref}
              className="font-semibold text-brand-pink transition hover:opacity-80"
            >
              Create account
            </Link>
          </p>

          <Link
            href="/experience/join-movement"
            className="font-ui text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-brand-muted transition hover:text-brand-blue"
          >
            Join the movement
          </Link>
        </div>
      </PageContainer>
    </div>
  );
}
