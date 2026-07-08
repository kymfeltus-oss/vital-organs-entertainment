"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import GenericTabShell from "@/components/ui/shell/GenericTabShell";
import { useVocabulary } from "@/hooks/useVocabulary";
import { getClientAppUrl } from "@/lib/client-api";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import {
  BUY_SEEDS_DEFAULT_PACKAGE_ID,
  type SeedPackageId,
} from "@/lib/seeds/assets";
import { SEED_PACKAGES } from "@/lib/billing-config";
import { useSeedCheckout } from "@/lib/useSeedCheckout";
import { cn } from "@/lib/utils";

type BuySeedsPageContentProps = {
  initialProfile: AttendeeProfileSnapshot;
};

function BuySeedsPageContent({ initialProfile }: BuySeedsPageContentProps) {
  const { vocabulary } = useVocabulary();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const successParam = searchParams.get("success") === "true";
  const checkoutSessionId = searchParams.get("session_id")?.trim() ?? null;

  const [selectedPackageId, setSelectedPackageId] =
    useState<SeedPackageId>(BUY_SEEDS_DEFAULT_PACKAGE_ID);
  const [showThankYou, setShowThankYou] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [seedBalance, setSeedBalance] = useState(0);
  const [seedBalanceLoading, setSeedBalanceLoading] = useState(true);
  const [seedBalanceError, setSeedBalanceError] = useState<string | null>(null);

  const { isSubmitting, errorMessage, activePackageId, startCheckout, clearError } =
    useSeedCheckout();

  const refreshSeedBalance = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`${getClientAppUrl()}/api/live/seeds`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        signal,
      });
      const data = (await response.json()) as { balance?: number; error?: string };

      if (response.status === 401) {
        setSeedBalance(0);
        setSeedBalanceError(null);
      } else if (!response.ok) {
        setSeedBalanceError(data.error ?? "Unable to load seed balance.");
      } else {
        setSeedBalance(typeof data.balance === "number" ? data.balance : 0);
        setSeedBalanceError(null);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setSeedBalanceError("Unable to load seed balance.");
    } finally {
      if (!signal?.aborted) setSeedBalanceLoading(false);
    }
  }, []);

  const confirmSeedCheckout = useCallback(
    async (sessionId: string, signal: AbortSignal): Promise<boolean> => {
      setSeedBalanceLoading(true);

      try {
        const response = await fetch(
          `${getClientAppUrl()}/api/billing/checkout/confirm`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
            signal,
          },
        );
        const data = (await response.json()) as {
          success?: boolean;
          balance?: number;
          error?: string;
        };

        if (!response.ok || !data.success) {
          setSeedBalanceError(
            data.error ?? "Payment completed, but the balance is still processing.",
          );
          return false;
        }

        setSeedBalance(typeof data.balance === "number" ? data.balance : 0);
        setSeedBalanceError(null);
        setShowThankYou(true);
        return true;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return false;
        setSeedBalanceError("Payment completed, but the balance is still processing.");
        return false;
      } finally {
        if (!signal.aborted) setSeedBalanceLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    let refreshTimer: number | null = null;

    if (!successParam) {
      queueMicrotask(() => {
        if (!controller.signal.aborted) {
          void refreshSeedBalance(controller.signal);
        }
      });

      return () => {
        controller.abort();
      };
    }

    queueMicrotask(() => {
      void (async () => {
        if (checkoutSessionId) {
          await confirmSeedCheckout(checkoutSessionId, controller.signal);
        } else {
          await refreshSeedBalance(controller.signal);
        }

        if (controller.signal.aborted) return;
        window.history.replaceState({}, "", pathname);

        let refreshCount = 0;
        refreshTimer = window.setInterval(() => {
          refreshCount += 1;
          void refreshSeedBalance(controller.signal);
          if (refreshCount >= 6 && refreshTimer !== null) {
            window.clearInterval(refreshTimer);
            refreshTimer = null;
          }
        }, 1_500);
      })();
    });

    return () => {
      controller.abort();
      if (refreshTimer !== null) window.clearInterval(refreshTimer);
    };
  }, [checkoutSessionId, confirmSeedCheckout, successParam, pathname, refreshSeedBalance]);

  const handleContinue = useCallback(() => {
    void startCheckout(selectedPackageId);
  }, [selectedPackageId, startCheckout]);

  return (
    <>
      <GenericTabShell
        title={vocabulary.tokenShopLabel}
        subtitle="Credits for live interactions"
        profile={profile}
        onProfileChange={setProfile}
      >
        <section className="space-y-5" aria-label="Seed packages">
          <div className="theme-card rounded-2xl p-4">
            <p className="theme-label">Your balance</p>
            <p
              className="mt-2 text-3xl font-semibold tabular-nums"
              style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-headline)" }}
            >
              {seedBalanceLoading ? "…" : seedBalance.toLocaleString("en-US")}
            </p>
            {seedBalanceError ? (
              <p className="mt-2 text-sm" style={{ color: "var(--theme-accent)" }}>
                {seedBalanceError}
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            {SEED_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                className={cn(
                  "theme-card touch-target flex w-full items-center justify-between gap-4 p-4 text-left transition",
                  selectedPackageId === pkg.id && "theme-card--active",
                )}
                onClick={() => {
                  setSelectedPackageId(pkg.id);
                  clearError();
                }}
              >
                <div>
                  <p className="font-semibold" style={{ color: "var(--theme-text)" }}>
                    {pkg.count.toLocaleString("en-US")} seeds
                  </p>
                  <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
                    Live room credits
                  </p>
                </div>
                <p className="text-lg font-semibold" style={{ color: "var(--theme-primary)" }}>
                  ${pkg.price.toFixed(2)}
                </p>
              </button>
            ))}
          </div>

          {errorMessage ? (
            <p className="text-sm" style={{ color: "var(--theme-accent)" }} role="alert">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleContinue}
            className="theme-button-primary touch-target flex w-full min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
          >
            {isSubmitting && activePackageId === selectedPackageId ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Processing…
              </>
            ) : (
              "Continue to payment"
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
                Your seeds are ready for the live room.
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

type BuySeedsPageClientProps = {
  initialProfile: AttendeeProfileSnapshot;
};

export default function BuySeedsPageClient({ initialProfile }: BuySeedsPageClientProps) {
  return (
    <Suspense fallback={null}>
      <BuySeedsPageContent initialProfile={initialProfile} />
    </Suspense>
  );
}
