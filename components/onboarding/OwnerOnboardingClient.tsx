"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2, Upload } from "lucide-react";
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

export default function OwnerOnboardingClient({
  selectedTier = "starter",
}: OwnerOnboardingClientProps) {
  const platformHost = useMemo(() => getMarketingPlatformHost(), []);

  const [step, setStep] = useState<Step>(1);
  const [companyName, setCompanyName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#00a8ff");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  const [subdomainStatus, setSubdomainStatus] = useState<SubdomainStatus>("idle");
  const [subdomainMessage, setSubdomainMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);

  const tierLabel = useMemo(() => {
    if (selectedTier === "pro") return "Network Pro";
    if (selectedTier === "enterprise") return "Enterprise Stack";
    return "Starter Node";
  }, [selectedTier]);

  const passwordStrength = useMemo(() => evaluatePasswordStrength(password), [password]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [logoFile]);

  useEffect(() => {
    if (step !== 2) return;

    const normalized = sanitizeTenantIdInput(tenantId);
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
  }, [tenantId, step]);

  const canContinueStep1 =
    companyName.trim().length >= 2 && isValidEmail(ownerEmail) && passwordStrength.isValid;

  const canContinueStep2 =
    isValidTenantId(sanitizeTenantIdInput(tenantId)) && subdomainStatus === "available";

  const goNext = () => setStep((current) => Math.min(3, current + 1) as Step);
  const goBack = () => setStep((current) => Math.max(1, current - 1) as Step);

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("companyName", companyName.trim());
      formData.append("ownerEmail", ownerEmail.trim().toLowerCase());
      formData.append("password", password);
      formData.append("tenantId", sanitizeTenantIdInput(tenantId));
      formData.append("primaryColor", primaryColor);
      if (logoFile) formData.append("logo", logoFile);

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
        throw new Error(result.error ?? "Registration failed.");
      }

      const registeredTenantId = sanitizeTenantIdInput(tenantId);

      if (selectedTier === "enterprise") {
        window.location.href = `/contact-us?intent=enterprise&tenant=${encodeURIComponent(registeredTenantId)}`;
        return;
      }

      setIsStartingCheckout(true);

      const checkoutResponse = await fetch("/api/billing/platform-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: selectedTier,
          tenantId: registeredTenantId,
        }),
      });

      const checkoutResult = (await checkoutResponse.json()) as { url?: string; error?: string };
      if (!checkoutResponse.ok || !checkoutResult.url) {
        setSuccessUrl(result.tenantUrl);
        throw new Error(checkoutResult.error ?? "Unable to start subscription checkout.");
      }

      window.location.href = checkoutResult.url;
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
      setIsStartingCheckout(false);
    }
  };

  if (isStartingCheckout) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16 text-center">
        <Loader2 className="mx-auto mb-5 size-10 animate-spin text-[#00a8ff]" aria-hidden="true" />
        <h1 className="font-headline text-2xl uppercase tracking-[0.08em] text-white">
          Starting secure checkout
        </h1>
        <p className="mt-3 font-body text-sm leading-relaxed text-white/70">
          Your network is registered. Redirecting to Stripe for the {tierLabel} plan…
        </p>
      </div>
    );
  }

  if (successUrl) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16 text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
          <Check className="size-7" aria-hidden="true" />
        </div>
        <h1 className="font-headline text-3xl uppercase tracking-[0.08em] text-white">
          Network registered
        </h1>
        <p className="mt-3 font-body text-sm leading-relaxed text-white/70">
          Your tenant theme row is saved and your owner account is ready. Visit your branded
          subdomain to launch the viewer experience.
        </p>
        <a
          href={successUrl}
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#00a8ff] via-[#8a2eff] to-[#ff2faf] px-6 font-ui text-xs font-bold uppercase tracking-[0.14em] text-white"
        >
          Open your network
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 font-ui text-xs uppercase tracking-[0.12em] text-white/55 transition hover:text-white"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to storefront
      </Link>

      <header className="mb-8">
        <p className="font-ui text-xs font-semibold uppercase tracking-[0.24em] text-[#00a8ff]">
          Business owner onboarding
        </p>
        <h1 className="mt-2 font-headline text-3xl uppercase tracking-[0.06em] text-white md:text-4xl">
          Register your network
        </h1>
        <p className="mt-2 font-body text-sm text-white/65">
          Three quick steps to claim your subdomain, brand assets, and owner credentials.
        </p>
        <p className="mt-3 inline-flex rounded-full border border-[#00a8ff]/35 bg-[#00a8ff]/10 px-3 py-1 font-ui text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9de8ff]">
          Selected plan: {tierLabel}
        </p>
      </header>

      <ol className="mb-8 grid grid-cols-3 gap-2">
        {[
          { id: 1, label: "Account" },
          { id: 2, label: "Subdomain" },
          { id: 3, label: "Branding" },
        ].map((item) => (
          <li
            key={item.id}
            className={`rounded-xl border px-3 py-2 text-center font-ui text-[11px] font-semibold uppercase tracking-[0.14em] ${
              step === item.id
                ? "border-[#8a2eff]/70 bg-[#8a2eff]/10 text-white"
                : step > item.id
                  ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-200"
                  : "border-white/10 bg-white/[0.03] text-white/45"
            }`}
          >
            Step {item.id}: {item.label}
          </li>
        ))}
      </ol>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        {step === 1 ? (
          <div className="space-y-5">
            <h2 className="font-card-title text-xl uppercase tracking-[0.08em] text-white">
              Account details
            </h2>
            <label className="block space-y-2">
              <span className="font-ui text-xs uppercase tracking-[0.12em] text-white/55">
                Company name
              </span>
              <input
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 font-body text-sm text-white outline-none transition focus:border-[#00a8ff]/60"
                placeholder="Alpha Worship Collective"
              />
            </label>
            <label className="block space-y-2">
              <span className="font-ui text-xs uppercase tracking-[0.12em] text-white/55">
                Owner email
              </span>
              <input
                type="email"
                value={ownerEmail}
                onChange={(event) => setOwnerEmail(event.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 font-body text-sm text-white outline-none transition focus:border-[#00a8ff]/60"
                placeholder="owner@yourcompany.com"
              />
            </label>
            <label className="block space-y-2">
              <span className="font-ui text-xs uppercase tracking-[0.12em] text-white/55">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 font-body text-sm text-white outline-none transition focus:border-[#00a8ff]/60"
                placeholder="Create a secure password"
              />
            </label>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {passwordStrength.checks.map((check) => (
                <li
                  key={check.id}
                  className={`font-ui text-xs ${check.passed ? "text-emerald-300" : "text-white/45"}`}
                >
                  {check.passed ? "✓" : "○"} {check.label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <h2 className="font-card-title text-xl uppercase tracking-[0.08em] text-white">
              Choose your subdomain
            </h2>
            <label className="block space-y-2">
              <span className="font-ui text-xs uppercase tracking-[0.12em] text-white/55">
                Desired web address
              </span>
              <div className="flex overflow-hidden rounded-xl border border-white/15 bg-black/30">
                <input
                  value={tenantId}
                  onChange={(event) => setTenantId(sanitizeTenantIdInput(event.target.value))}
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 font-body text-sm text-white outline-none"
                  placeholder="alpha"
                />
                <span className="flex items-center border-l border-white/10 px-3 font-mono text-xs text-white/45">
                  .{platformHost}
                </span>
              </div>
            </label>
            {subdomainMessage ? (
              <p
                className={`font-ui text-xs ${
                  subdomainStatus === "available"
                    ? "text-emerald-300"
                    : subdomainStatus === "checking"
                      ? "text-white/55"
                      : "text-[#ff8fd9]"
                }`}
              >
                {subdomainStatus === "checking" ? "Checking availability…" : subdomainMessage}
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6">
            <h2 className="font-card-title text-xl uppercase tracking-[0.08em] text-white">
              Branding preview
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="font-ui text-xs uppercase tracking-[0.12em] text-white/55">
                  Primary color
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    className="h-12 w-14 cursor-pointer rounded-lg border border-white/15 bg-transparent"
                  />
                  <input
                    value={primaryColor}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    className="flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none"
                  />
                </div>
              </label>
              <label className="block space-y-2">
                <span className="font-ui text-xs uppercase tracking-[0.12em] text-white/55">
                  Logo image
                </span>
                <div className="flex items-center gap-3">
                  <label className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-black/20 px-4 font-ui text-xs uppercase tracking-[0.12em] text-white/75 transition hover:border-white/40">
                    <Upload className="size-4" aria-hidden="true" />
                    Upload logo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="sr-only"
                      onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </label>
            </div>

            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: `${primaryColor}55`,
                background: `linear-gradient(180deg, ${primaryColor}22 0%, rgba(2,2,3,0.92) 100%)`,
              }}
            >
              <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-white/50">
                Live preview
              </p>
              <div className="mt-4 flex items-center gap-4">
                <div
                  className="flex size-16 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-black/35"
                >
                  {logoPreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreviewUrl} alt="Logo preview" className="h-full w-full object-contain" />
                  ) : (
                    <span className="font-headline text-lg text-white/35">LOGO</span>
                  )}
                </div>
                <div>
                  <p className="font-headline text-2xl uppercase tracking-[0.08em] text-white">
                    {companyName || "Your Network"}
                  </p>
                  <p className="font-ui text-xs uppercase tracking-[0.16em]" style={{ color: primaryColor }}>
                    {sanitizeTenantIdInput(tenantId) || "yourbrand"}.{platformHost}
                  </p>
                </div>
              </div>
            </div>

            {submitError ? (
              <p className="rounded-xl border border-[#ff2faf]/35 bg-[#ff2faf]/10 px-4 py-3 font-ui text-sm text-[#ffb8e8]">
                {submitError}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1 || isSubmitting}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-5 font-ui text-xs font-semibold uppercase tracking-[0.12em] text-white/75 transition hover:border-white/35 disabled:opacity-40"
          >
            Back
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={(step === 1 && !canContinueStep1) || (step === 2 && !canContinueStep2)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00a8ff] via-[#8a2eff] to-[#ff2faf] px-6 font-ui text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-45"
            >
              Continue
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00a8ff] via-[#8a2eff] to-[#ff2faf] px-6 font-ui text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Registering…
                </>
              ) : (
                "Launch network"
              )}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
