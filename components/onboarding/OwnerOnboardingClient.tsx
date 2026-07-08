"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PlatformTierId } from "@/components/admin/PlanSelectionCta";
import { evaluatePasswordStrength } from "@/lib/auth/password-policy";
import { isValidEmail } from "@/lib/auth/validation";
import { isValidTenantId, sanitizeTenantIdInput } from "@/lib/onboarding/tenant-id";
import { getMarketingPlatformHost } from "@/lib/theme/platform-domains";

type Step = 1 | 2 | 3;
type SubdomainStatus = "idle" | "checking" | "available" | "taken" | "invalid";

type OwnerOnboardingClientProps = {
  selectedTier?: PlatformTierId;
};

const TIER_ALLOCATION_LABEL: Record<PlatformTierId, string> = {
  starter: "Ministry Mission Node",
  pro: "Sanctuary Pro Engine",
  enterprise: "Global Ministry Cluster",
};

export default function OwnerOnboardingClient({
  selectedTier = "starter",
}: OwnerOnboardingClientProps) {
  const platformHost = useMemo(() => getMarketingPlatformHost(), []);

  const [step, setStep] = useState<Step>(1);
  const [ministryName, setMinistryName] = useState("");
  const [leaderEmail, setLeaderEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#FFB800");

  const [subdomainStatus, setSubdomainStatus] = useState<SubdomainStatus>("idle");
  const [subdomainMessage, setSubdomainMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stepValidationError, setStepValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  const passwordStrength = useMemo(() => evaluatePasswordStrength(password), [password]);
  const tierLabel = TIER_ALLOCATION_LABEL[selectedTier];

  useEffect(() => {
    if (step !== 2) return;

    const normalized = sanitizeTenantIdInput(subdomain);
    if (!normalized) {
      setSubdomainStatus("idle");
      setSubdomainMessage(null);
      return;
    }

    if (!isValidTenantId(normalized)) {
      setSubdomainStatus("invalid");
      setSubdomainMessage("Use 3–32 lowercase letters, numbers, or hyphens.");
      return;
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        setSubdomainStatus("checking");
        try {
          const response = await fetch(
            `/api/onboarding/check-subdomain?tenantId=${encodeURIComponent(normalized)}`,
          );
          const result = (await response.json()) as {
            available?: boolean;
            message?: string;
          };
          setSubdomainStatus(result.available ? "available" : "taken");
          setSubdomainMessage(result.message ?? null);
        } catch {
          setSubdomainStatus("invalid");
          setSubdomainMessage("Unable to verify subdomain right now.");
        }
      })();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [subdomain, step]);

  useEffect(() => {
    setStepValidationError(null);
  }, [ministryName, leaderEmail, password, subdomain, step]);

  const resolveStepValidationError = (currentStep: Step): string | null => {
    if (currentStep === 1) {
      if (ministryName.trim().length < 2) {
        return "Enter your church or ministry title to continue.";
      }
      if (!isValidEmail(leaderEmail)) {
        return "Enter a valid administrative email address to continue.";
      }
      if (!passwordStrength.isValid) {
        return passwordStrength.message ?? "Complete all password security requirements to continue.";
      }
      return null;
    }

    if (currentStep === 2) {
      const normalized = sanitizeTenantIdInput(subdomain);
      if (!normalized) {
        return "Enter a sanctuary subdomain prefix to continue.";
      }
      if (!isValidTenantId(normalized)) {
        return "Use 3–32 lowercase letters, numbers, or hyphens for your subdomain.";
      }
      if (subdomainStatus === "checking") {
        return "Checking subdomain availability. Please wait a moment.";
      }
      if (subdomainStatus !== "available") {
        return subdomainMessage ?? "Choose an available subdomain before continuing.";
      }
      return null;
    }

    return null;
  };

  const handleContinue = () => {
    setSubmitError(null);
    const validationError = resolveStepValidationError(step);
    if (validationError) {
      setStepValidationError(validationError);
      return;
    }

    setStepValidationError(null);
    setStep((current) => Math.min(3, current + 1) as Step);
  };

  const handleMinistryDeployment = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    setStepValidationError(null);

    if (step < 3) {
      handleContinue();
      return;
    }

    setLoading(true);

    try {
      const cleanSubdomain = sanitizeTenantIdInput(subdomain);
      const formData = new FormData();
      formData.append("companyName", ministryName.trim());
      formData.append("ownerEmail", leaderEmail.trim().toLowerCase());
      formData.append("password", password);
      formData.append("tenantId", cleanSubdomain);
      formData.append("primaryColor", primaryColor);

      const response = await fetch("/api/onboarding/register", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as {
        ok?: boolean;
        tenantUrl?: string;
        error?: string;
      };

      if (!response.ok || !result.ok || !result.tenantUrl) {
        const message = result.error ?? "Infrastructure provisioning timeout. Please retry.";
        setSubmitError(message);
        if (/already registered|administrative email/i.test(message)) {
          setStep(1);
        } else if (step !== 3) {
          setStep(3);
        }
        return;
      }

      if (selectedTier === "enterprise") {
        window.location.href = `/contact-us?intent=enterprise&tenant=${encodeURIComponent(cleanSubdomain)}`;
        return;
      }

      setIsStartingCheckout(true);

      const checkoutResponse = await fetch("/api/billing/platform-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: selectedTier,
          tenantId: cleanSubdomain,
        }),
      });

      const checkoutResult = (await checkoutResponse.json()) as { url?: string; error?: string };
      if (!checkoutResponse.ok || !checkoutResult.url) {
        setSuccessUrl(result.tenantUrl);
        setSubmitError(checkoutResult.error ?? "Unable to start subscription checkout.");
        return;
      }

      window.location.href = checkoutResult.url;
    } catch (error) {
      console.error("Sanctuary node deployment failure:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Infrastructure provisioning timeout. Please retry.",
      );
      if (step !== 3) {
        setStep(3);
      }
    } finally {
      setLoading(false);
      setIsStartingCheckout(false);
    }
  };

  if (isStartingCheckout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#000000] px-6 text-center text-white">
        <div>
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-[#FFB800]/25 border-t-[#FFB800]" />
          <h1 className="text-xl font-bold tracking-wide uppercase">Deploying Sanctuary Nodes</h1>
          <p className="mt-3 text-sm text-white/60">
            Redirecting to secure checkout for {tierLabel}…
          </p>
        </div>
      </div>
    );
  }

  if (successUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#000000] px-6 text-center text-white">
        <div className="max-w-md">
          <div className="mx-auto mb-5 h-2 w-2 rounded-full bg-[#FFB800] shadow-[0_0_14px_#FFB800]" />
          <h1 className="text-2xl font-extrabold tracking-tight uppercase">Sanctuary Node Registered</h1>
          <p className="mt-3 text-sm text-white/65">
            Your ministry theme row is saved. Open your branded subdomain to launch the sanctuary
            experience.
          </p>
          <a
            href={successUrl}
            className="mt-8 inline-flex h-11 items-center justify-center rounded bg-[#FFB800] px-6 text-[10px] font-bold tracking-[0.22em] text-black uppercase"
          >
            Open Sanctuary Node →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-y-auto bg-[#000000] pb-16 font-sans text-white selection:bg-[#FFB800] selection:text-black">
      <style>{`
        @keyframes sanctuary-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .sanctuary-fade-in { animation: sanctuary-fade-in 0.45s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .sanctuary-fade-in { animation: none; }
        }
      `}</style>

      <div
        className="pointer-events-none absolute left-1/2 top-[5%] z-0 h-[350px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#FFB800]/10 to-transparent blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,#0c0e1a_1px,transparent_1px),linear-gradient(to_bottom,#0c0e1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_85%,transparent_100%)] opacity-30"
        aria-hidden="true"
      />

      <nav className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between border-b border-neutral-900/40 bg-black/10 px-8 py-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FFB800] shadow-[0_0_12px_#FFB800]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400">
            PΛRΛBLE FAITH REGISTRY
          </span>
        </div>
        <Link
          href="/"
          className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 transition-colors hover:text-white"
        >
          ← Back to Storefront
        </Link>
      </nav>

      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-12">
        <div className="relative w-full rounded-3xl border border-neutral-900/80 bg-neutral-950/40 p-10 shadow-2xl backdrop-blur-xl md:p-12">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFB800]/30 to-transparent" />

          <header className="mb-8 text-left">
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.4em] text-[#FFB800]">
              Ministry Operator Onboarding
            </p>
            <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-white">
              Provision Your Sanctuary Node
            </h1>
            <p className="text-xs font-light leading-relaxed text-neutral-400">
              Three quick infrastructure configuration steps to claim your dedicated ministry
              subdomain, sync brand assets, and activate leader credentials.
            </p>
            <div className="mt-4 inline-block rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-[#FFB800]">
              Selected Allocation: {tierLabel}
            </div>
          </header>

          <div className="mb-10 grid grid-cols-3 gap-3 text-center font-mono text-[10px] uppercase tracking-widest">
            {[
              { id: 1, label: "Step 1: Account" },
              { id: 2, label: "Step 2: Domain" },
              { id: 3, label: "Step 3: Theme" },
            ].map((item) => (
              <div
                key={item.id}
                className={`rounded border py-2 transition-colors ${
                  step === item.id
                    ? "border-[#FFB800] bg-[#FFB800]/5 font-bold text-[#FFB800]"
                    : "border-neutral-900 text-neutral-500"
                }`}
              >
                {item.label}
              </div>
            ))}
          </div>

          <form onSubmit={(event) => void handleMinistryDeployment(event)} className="space-y-6" noValidate>
            {step === 1 ? (
              <div className="sanctuary-fade-in space-y-5">
                <h2 className="border-b border-neutral-900 pb-2 text-sm font-bold uppercase tracking-wide text-neutral-300">
                  Ministry Leader Details
                </h2>
                <div>
                  <label
                    htmlFor="ministry-name"
                    className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-neutral-500"
                  >
                    Church / Ministry Title
                  </label>
                  <input
                    id="ministry-name"
                    type="text"
                    value={ministryName}
                    onChange={(event) => setMinistryName(event.target.value)}
                    required
                    placeholder="Alpha Worship Collective"
                    className="w-full rounded-xl border border-neutral-900 bg-black px-4 py-3 text-xs text-white transition-colors focus:border-[#FFB800] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="leader-email"
                    className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-neutral-500"
                  >
                    Administrative Email
                  </label>
                  <input
                    id="leader-email"
                    type="email"
                    value={leaderEmail}
                    onChange={(event) => setLeaderEmail(event.target.value)}
                    required
                    placeholder="leader@yourministry.org"
                    className="w-full rounded-xl border border-neutral-900 bg-black px-4 py-3 text-xs text-white transition-colors focus:border-[#FFB800] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="access-password"
                    className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-neutral-500"
                  >
                    Secure Access Password
                  </label>
                  <input
                    id="access-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-neutral-900 bg-black px-4 py-3 text-xs text-white placeholder-neutral-800 transition-colors focus:border-[#FFB800] focus:outline-none"
                  />
                </div>
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {passwordStrength.checks.map((check) => (
                    <li
                      key={check.id}
                      className={`text-[10px] ${check.passed ? "text-[#FFB800]" : "text-neutral-600"}`}
                    >
                      {check.passed ? "✓" : "○"} {check.label}
                    </li>
                  ))}
                </ul>
                {!passwordStrength.isValid ? (
                  <p className="text-[10px] text-neutral-500">
                    Complete the password requirements above, then press Continue.
                  </p>
                ) : null}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="sanctuary-fade-in space-y-5">
                <h2 className="border-b border-neutral-900 pb-2 text-sm font-bold uppercase tracking-wide text-neutral-300">
                  Subdomain Allocation
                </h2>
                <div>
                  <label
                    htmlFor="sanctuary-prefix"
                    className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-neutral-500"
                  >
                    Desired Sanctuary Prefix
                  </label>
                  <div className="flex overflow-hidden rounded-xl border border-neutral-900 bg-black transition-colors focus-within:border-[#FFB800]">
                    <input
                      id="sanctuary-prefix"
                      type="text"
                      value={subdomain}
                      onChange={(event) => setSubdomain(sanitizeTenantIdInput(event.target.value))}
                      required
                      placeholder="vanguard"
                      className="flex-1 bg-transparent px-4 py-3 text-xs text-white placeholder-neutral-700 focus:outline-none"
                    />
                    <span className="flex items-center border-l border-neutral-900 bg-neutral-950 px-4 py-3 font-mono text-xs text-neutral-500">
                      .{platformHost}
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] font-light text-neutral-500">
                    This establishes your isolated data network lane. Viewers will navigate here
                    directly for live sanctuary streams.
                  </p>
                  {subdomainMessage ? (
                    <p
                      className={`mt-2 text-[10px] ${
                        subdomainStatus === "available"
                          ? "text-[#FFB800]"
                          : subdomainStatus === "checking"
                            ? "text-neutral-500"
                            : "text-neutral-400"
                      }`}
                    >
                      {subdomainStatus === "checking" ? "Checking availability…" : subdomainMessage}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="sanctuary-fade-in space-y-5">
                <h2 className="border-b border-neutral-900 pb-2 text-sm font-bold uppercase tracking-wide text-neutral-300">
                  Sanctuary Interface Theming
                </h2>
                <div>
                  <label
                    htmlFor="liturgical-accent"
                    className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-neutral-500"
                  >
                    Primary Liturgical Accent Color
                  </label>
                  <div className="flex items-center gap-4 rounded-xl border border-neutral-900 bg-black p-4">
                    <input
                      id="liturgical-accent"
                      type="color"
                      value={primaryColor}
                      onChange={(event) => setPrimaryColor(event.target.value)}
                      className="h-12 w-12 cursor-pointer rounded-xl border-0 bg-transparent"
                    />
                    <div>
                      <span className="block font-mono text-xs uppercase tracking-widest text-neutral-200">
                        {primaryColor}
                      </span>
                      <span className="text-[10px] font-light text-neutral-500">
                        This color highlights your play keys, donation sliders, and community chat
                        accents natively.
                      </span>
                    </div>
                  </div>
                </div>
                {submitError ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-xs text-neutral-300"
                  >
                    <p>{submitError}</p>
                    {/already registered/i.test(submitError) ? (
                      <p className="mt-2">
                        <Link href="/login" className="text-[#FFB800] underline underline-offset-2">
                          Sign in to your existing operator account →
                        </Link>
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {submitError && step !== 3 ? (
              <div
                role="alert"
                className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-xs text-neutral-300"
              >
                <p>{submitError}</p>
                {/already registered/i.test(submitError) ? (
                  <p className="mt-2">
                    <Link href="/login" className="text-[#FFB800] underline underline-offset-2">
                      Sign in to your existing operator account →
                    </Link>
                  </p>
                ) : null}
              </div>
            ) : null}

            {stepValidationError ? (
              <p
                role="alert"
                className="rounded-xl border border-[#FFB800]/30 bg-[#FFB800]/8 px-4 py-3 text-xs text-[#FFB800]"
              >
                {stepValidationError}
              </p>
            ) : null}

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-neutral-900/60 pt-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setStepValidationError(null);
                    setStep((current) => Math.max(1, current - 1) as Step);
                  }}
                  disabled={loading}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-900 bg-neutral-950 px-6 font-mono text-xs uppercase tracking-widest text-neutral-400 transition-all hover:border-neutral-800 hover:text-white disabled:opacity-50"
                >
                  ← Back
                </button>
              ) : (
                <span />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={loading || (step === 2 && subdomainStatus === "checking")}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[#FFB800] px-6 font-mono text-xs font-bold uppercase tracking-widest text-black transition-all hover:opacity-90 hover:shadow-[0_0_24px_rgba(255,184,0,0.22)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {step === 2 && subdomainStatus === "checking" ? "Checking Subdomain…" : "Continue →"}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[#FFB800] px-6 font-mono text-xs font-bold uppercase tracking-widest text-black transition-all hover:opacity-90 hover:shadow-[0_0_24px_rgba(255,184,0,0.22)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Deploying Sanctuary Nodes..." : "Initialize Infrastructure"}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>

      <footer className="relative z-10 border-t border-neutral-900/50 px-8 py-5">
        <div className="mx-auto flex max-w-7xl items-center gap-2.5 font-mono text-[8px] uppercase tracking-[0.28em] text-neutral-600">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FFB800] shadow-[0_0_10px_#FFB800]" aria-hidden="true" />
          <p>
            PΛRΛBLE INFRASTRUCTURE CORE PLATFORM SYSTEMS ONLINE // SOVEREIGN SECURITY ACTIVE
          </p>
        </div>
      </footer>
    </div>
  );
}
