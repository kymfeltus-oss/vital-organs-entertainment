"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import BuySeedsPlate from "@/components/buy-seeds/BuySeedsPlate";
import { getClientAppUrl } from "@/lib/client-api";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import { CONTENT_WITH_NAV } from "@/lib/responsive";
import {
  BUY_SEEDS_DEFAULT_PACKAGE_ID,
  type SeedPackageId,
} from "@/lib/seeds/assets";
import { useSeedCheckout } from "@/lib/useSeedCheckout";

type BuySeedsPageContentProps = {
  initialProfile: AttendeeProfileSnapshot;
};

function BuySeedsPageContent({ initialProfile }: BuySeedsPageContentProps) {
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
            data.error ?? "Payment completed, but the seed balance is still processing.",
          );
          return false;
        }

        setSeedBalance(typeof data.balance === "number" ? data.balance : 0);
        setSeedBalanceError(null);
        setShowThankYou(true);
        return true;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return false;
        setSeedBalanceError(
          "Payment completed, but the seed balance is still processing.",
        );
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
  }, [
    checkoutSessionId,
    confirmSeedCheckout,
    successParam,
    pathname,
    refreshSeedBalance,
  ]);

  const handleSelectPackage = useCallback(
    (packageId: SeedPackageId) => {
      setSelectedPackageId(packageId);
      clearError();
    },
    [clearError],
  );

  const handleContinue = useCallback(() => {
    void startCheckout(selectedPackageId);
  }, [selectedPackageId, startCheckout]);

  return (
    <>
      <section
        className={`${CONTENT_WITH_NAV} flex min-h-0 w-full flex-1 flex-col overflow-hidden text-white`}
        aria-label="Buy Vital Seeds"
      >
        <BuySeedsPlate
          seedBalance={seedBalance}
          seedBalanceLoading={seedBalanceLoading}
          seedBalanceError={seedBalanceError}
          profile={profile}
          onProfileChange={setProfile}
          selectedPackageId={selectedPackageId}
          isSubmitting={isSubmitting}
          activePackageId={activePackageId}
          errorMessage={errorMessage}
          onSelectPackage={handleSelectPackage}
          onContinue={handleContinue}
        />
      </section>

      <AnimatePresence>
        {showThankYou ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
            onClick={() => setShowThankYou(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="mx-auto w-full max-w-2xl rounded-3xl border border-brand-blue/50 bg-brand-panel p-8 text-center shadow-[0_0_40px_rgba(0,168,255,0.35)]"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-brand-blue">
                Seeds Credited
              </p>
              <h2 className="mt-4 font-headline text-xl uppercase tracking-widest text-white">
                Thank You
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-brand-muted">
                Your Vital Seeds are ready for the live room. Shower the stage when the concert goes
                live.
              </p>
              <button
                type="button"
                onClick={() => setShowThankYou(false)}
                className="touch-target mt-8 w-full rounded-2xl border border-brand-blue bg-brand-blue/10 px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-brand-blue/20"
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
