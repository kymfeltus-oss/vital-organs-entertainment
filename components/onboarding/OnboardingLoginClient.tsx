"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { isValidEmail } from "@/lib/auth/validation";
import { ONBOARDING_PATH, buildOnboardingLoginUrl } from "@/lib/onboarding/routes";

type OnboardingLoginClientProps = {
  nextPath: string;
  initialEmail?: string;
  authError?: string | null;
};

export default function OnboardingLoginClient({
  nextPath,
  initialEmail = "",
  authError = null,
}: OnboardingLoginClientProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(authError);

  const destination = useMemo(() => {
    const trimmed = nextPath.trim();
    return trimmed.startsWith("/") ? trimmed : ONBOARDING_PATH;
  }, [nextPath]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError("Enter a valid administrative email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "login",
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const result = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Unable to sign in.");
      }

      window.location.assign(destination);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-y-auto bg-[#000000] pb-16 font-sans text-white">
      <div
        className="pointer-events-none absolute left-1/2 top-[5%] z-0 h-[350px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#F5B400]/10 to-transparent blur-[120px]"
        aria-hidden="true"
      />

      <nav className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between border-b border-neutral-900/40 px-8 py-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400">
          PΛRΛBLE FAITH REGISTRY
        </span>
        <Link
          href={ONBOARDING_PATH}
          className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 transition-colors hover:text-white"
        >
          ← Back to Onboarding
        </Link>
      </nav>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="rounded-3xl border border-neutral-900/80 bg-neutral-950/40 p-8 shadow-2xl backdrop-blur-xl md:p-10">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.4em] text-[#F5B400]">
            Ministry Operator Access
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Sign In to Continue</h1>
          <p className="mt-3 text-xs leading-relaxed text-[#B3B3B3]">
            Optional while we build — use this if your email is already registered from a prior
            provisioning attempt. After sign-in you can finish subdomain and theme setup.
          </p>

          <form onSubmit={(event) => void handleSubmit(event)} className="mt-8 space-y-5" noValidate>
            <div>
              <label
                htmlFor="onboarding-login-email"
                className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-neutral-500"
              >
                Administrative Email
              </label>
              <input
                id="onboarding-login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className="w-full rounded-xl border border-neutral-900 bg-black px-4 py-3 text-xs text-white transition-colors focus:border-[#F5B400] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="onboarding-login-password"
                className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-neutral-500"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="onboarding-login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-neutral-900 bg-black px-4 py-3 pr-20 text-xs text-white transition-colors focus:border-[#F5B400] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase tracking-widest text-neutral-500 hover:text-white"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error ? (
              <p role="alert" className="rounded-xl border border-red-900/40 bg-red-950/30 px-4 py-3 text-xs text-red-300">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#F5B400] text-[10px] font-bold uppercase tracking-[0.24em] text-[#111111] transition hover:bg-[#FFC533] disabled:opacity-50"
            >
              {submitting ? "Signing In..." : "Sign In & Continue Onboarding"}
            </button>
          </form>

          <p className="mt-6 text-center text-[10px] text-neutral-500">
            Need a new ministry node?{" "}
            <Link href={ONBOARDING_PATH} className="text-[#F5B400] hover:underline">
              Start onboarding
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
