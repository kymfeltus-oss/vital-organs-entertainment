"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

type AuthTab = "login" | "signup" | "guest";

function resolveNextPath(rawNext: string | null): string {
  if (!rawNext || !rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return "/experience/live";
  }
  return rawNext;
}

function EmailGateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);
  const callbackFailureMessage =
    searchParams.get("error") === "auth_callback_failed"
      ? "Email confirmation failed or expired. Sign in again or request a new confirmation email."
      : null;
  const displayError = error ?? callbackFailureMessage;

  const handleNavigationForwarding = () => {
    const nextPath = resolveNextPath(searchParams.get("next"));
    router.refresh();
    router.push(nextPath);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: activeTab,
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Authentication failed");
      }

      handleNavigationForwarding();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      setStatus("idle");
    }
  };

  const handleGuestEntry = async () => {
    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "guest" }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Guest initialization failed");
      }

      handleNavigationForwarding();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Guest initialization failed");
      setStatus("idle");
    }
  };

  return (
    <main className="flex h-dvh w-screen items-center justify-center bg-[#0B090A] p-4 pt-safe pb-safe text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur-md md:p-8">
        <header className="mb-6 text-center md:text-left">
          <span className="mb-1 block text-[10px] font-bold tracking-widest text-[#1E40AF] uppercase">
            Access Verification Hub
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">
            Select Entry Route
          </h2>
        </header>

        <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-[#0B090A] p-1 text-xs font-semibold">
          {(["login", "signup", "guest"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setError(null);
              }}
              className={`rounded-lg py-2 capitalize transition-colors ${
                activeTab === tab
                  ? "border border-[#1E40AF]/40 bg-[#1E40AF]/20 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab === "signup" ? "Sign Up" : tab}
            </button>
          ))}
        </div>

        {activeTab !== "guest" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full rounded-xl border border-white/15 bg-[#0B090A] px-4 py-3 text-sm text-white transition-colors focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  activeTab === "signup"
                    ? "Create password (8+ chars)"
                    : "Your password"
                }
                className="w-full rounded-xl border border-white/15 bg-[#0B090A] px-4 py-3 text-sm text-white transition-colors focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
              />
            </div>

            <button
              type="submit"
              disabled={status === "submitting"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#B0267A] py-3 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Processing Secure Entry...</span>
                </>
              ) : activeTab === "login" ? (
                "Sign In"
              ) : (
                "Claim Pass"
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center md:text-left">
            <p className="text-xs leading-relaxed text-zinc-400">
              Start a short-lived authenticated guest profile. You can explore
              live chat and metrics, while the stream stage remains ticket-gated.
            </p>
            <button
              type="button"
              onClick={() => void handleGuestEntry()}
              disabled={status === "submitting"}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#111111] py-3 text-sm font-semibold text-white transition-all hover:border-[#1E40AF]/50 active:scale-[0.99] disabled:opacity-50"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Creating Guest Session...</span>
                </>
              ) : (
                "Continue as Guest →"
              )}
            </button>
          </div>
        )}

        {displayError && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-[#B0267A]/40 bg-[#B0267A]/10 px-4 py-3 text-center text-sm text-zinc-200"
          >
            {displayError}
          </p>
        )}
      </div>
    </main>
  );
}

export default function EmailGatePage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-dvh w-screen items-center justify-center bg-[#0B090A] text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin text-[#1E40AF]" />
        </main>
      }
    >
      <EmailGateContent />
    </Suspense>
  );
}
