"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import GenericTabShell from "@/components/ui/shell/GenericTabShell";
import { isValidEmail } from "@/lib/auth/validation";
import { getClientAppUrl } from "@/lib/client-api";
import { givingAmounts } from "@/lib/vital-seed/giving-assets";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import {
  amountToCents,
  parseAmountDollars,
  sanitizeAmountInput,
} from "@/lib/vital-seed/custom-amount";
import { cn } from "@/lib/utils";

const MIN_GIFT_CENTS = 50;

type GivingPageContentProps = {
  initialProfile: AttendeeProfileSnapshot;
};

function GivingPageContent({
  initialProfile,
}: GivingPageContentProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const successParam = searchParams.get("success") === "true";
  const guestMode =
    searchParams.get("guest") === "1" || searchParams.get("guest") === "true";

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(successParam);
  const [profile, setProfile] = useState(initialProfile);

  useEffect(() => {
    if (!successParam) return;
    window.history.replaceState({}, "", pathname);
  }, [successParam, pathname]);

  const handleGiveNow = useCallback(async () => {
    const normalizedGuestEmail = guestEmail.trim().toLowerCase();
    if (guestMode && !isValidEmail(normalizedGuestEmail)) {
      setError("Enter a valid email address for your giving receipt.");
      return;
    }

    if (selectedAmount == null || selectedAmount <= 0) {
      setError("Please select or enter an amount.");
      return;
    }

    const amountInCents = amountToCents(selectedAmount);

    if (!Number.isFinite(amountInCents) || amountInCents < MIN_GIFT_CENTS) {
      setError("Please enter a valid gift amount.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getClientAppUrl()}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amountInCents,
          frequency: "one_time",
          source: guestMode ? "in-person-qr" : "platform-giving",
          ...(guestMode ? { guest: true, guestEmail: normalizedGuestEmail } : {}),
        }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (response.status === 401) {
        setError(
          guestMode
            ? "Guest checkout could not be started. Please try again."
            : "Sign in before giving.",
        );
        return;
      }

      if (!response.ok || !data.url) {
        setError(data.error ?? "Unable to start checkout. Please try again.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Unable to reach checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [guestEmail, guestMode, selectedAmount]);

  return (
    <>
      <GenericTabShell
        title="Giving"
        subtitle="Support the mission"
        profile={profile}
        onProfileChange={setProfile}
      >
        <section className="space-y-5" aria-label="Giving form">
          <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>
            Choose an amount or enter a custom gift. Secure checkout opens in Stripe.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {givingAmounts.map((preset) => (
              <button
                key={preset.amount}
                type="button"
                className={cn(
                  "theme-card touch-target p-4 text-center transition",
                  activePreset === preset.amount && "theme-card--active",
                )}
                onClick={() => {
                  setActivePreset(preset.amount);
                  setSelectedAmount(preset.amount);
                  setCustomAmount("");
                  setError(null);
                }}
              >
                <p
                  className="text-lg font-semibold"
                  style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-headline)" }}
                >
                  ${preset.amount}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide" style={{ color: "var(--theme-text-muted)" }}>
                  {preset.label}
                </p>
              </button>
            ))}
          </div>

          <label className="block">
            <span className="theme-label mb-1.5 block">Custom amount</span>
            <input
              type="text"
              inputMode="decimal"
              value={customAmount}
              placeholder="0.00"
              className="theme-input w-full rounded-xl px-4 py-3 text-sm"
              onFocus={() => {
                setActivePreset(null);
                setError(null);
              }}
              onChange={(event) => {
                const sanitized = sanitizeAmountInput(event.target.value);
                setCustomAmount(sanitized);
                setActivePreset(null);
                setSelectedAmount(parseAmountDollars(sanitized));
                setError(null);
              }}
            />
          </label>

          {guestMode ? (
            <label className="block">
              <span className="theme-label mb-1.5 block">Email for receipt</span>
              <input
                type="email"
                value={guestEmail}
                autoComplete="email"
                className="theme-input w-full rounded-xl px-4 py-3 text-sm"
                onChange={(event) => {
                  setGuestEmail(event.target.value);
                  setError(null);
                }}
              />
            </label>
          ) : null}

          {error ? (
            <p className="text-sm" style={{ color: "var(--theme-accent)" }} role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            disabled={isLoading}
            onClick={() => void handleGiveNow()}
            className="theme-button-primary touch-target flex w-full min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Processing…
              </>
            ) : (
              "Give now"
            )}
          </button>
        </section>
      </GenericTabShell>

      <AnimatePresence>
        {showThankYou ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ backgroundColor: "color-mix(in srgb, var(--theme-bg) 75%, transparent)" }}
            onClick={() => setShowThankYou(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="glass-panel mx-auto w-full max-w-md rounded-2xl p-8 text-center"
              onClick={(event) => event.stopPropagation()}
            >
              <h2
                className="text-xl font-semibold"
                style={{ fontFamily: "var(--theme-font-headline)", color: "var(--theme-text)" }}
              >
                Thank you
              </h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>
                Your gift has been received. Thank you for your support.
              </p>
              <button
                type="button"
                onClick={() => setShowThankYou(false)}
                className="theme-button-secondary touch-target mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default function GivingPageClient({
  initialProfile,
}: GivingPageContentProps) {
  return (
    <Suspense fallback={null}>
      <GivingPageContent initialProfile={initialProfile} />
    </Suspense>
  );
}
