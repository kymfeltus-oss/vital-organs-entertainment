"use client";

import { Suspense, useCallback, useEffect, useState, type CSSProperties } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import ExperienceGivingMobileOverlay from "@/components/experience/giving/ExperienceGivingMobileOverlay";
import MobileArtboardTopChrome from "@/components/navigation/MobileArtboardTopChrome";
import { getClientAppUrl } from "@/lib/client-api";
import {
  GIVING_MOBILE_ART_NATIVE,
  GIVING_MOBILE_DEFAULT_AMOUNT,
  type GivingFrequency,
} from "@/lib/experience/giving-mobile-slots";
import { mobileArtboardStageStyle } from "@/lib/responsive";
import {
  amountToCents,
  parseAmountDollars,
  sanitizeAmountInput,
} from "@/lib/vital-seed/custom-amount";
import { VITAL_SEED_GIVING_ASSETS } from "@/lib/vital-seed/giving-assets";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

const MIN_GIFT_CENTS = 50;

type ExperienceGivingPageContentProps = {
  initialProfile: AttendeeProfileSnapshot;
};

function ExperienceGivingPageContent({
  initialProfile,
}: ExperienceGivingPageContentProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const successParam = searchParams.get("success") === "true";

  const [selectedAmount, setSelectedAmount] = useState<number | null>(
    GIVING_MOBILE_DEFAULT_AMOUNT,
  );
  const [activePreset, setActivePreset] = useState<number | null>(
    GIVING_MOBILE_DEFAULT_AMOUNT,
  );
  const [customAmount, setCustomAmount] = useState("");
  const [selectedFrequency, setSelectedFrequency] =
    useState<GivingFrequency>("one_time");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(successParam);
  const [profile, setProfile] = useState(initialProfile);

  useEffect(() => {
    if (!successParam) return;
    window.history.replaceState({}, "", pathname);
  }, [successParam, pathname]);

  const handleSelectAmount = useCallback((amount: number) => {
    setActivePreset(amount);
    setSelectedAmount(amount);
    setCustomAmount("");
    setError(null);
  }, []);

  const handleCustomAmountFocus = useCallback(() => {
    setActivePreset(null);
    setError(null);
  }, []);

  const handleCustomAmountChange = useCallback((value: string) => {
    const sanitized = sanitizeAmountInput(value);
    setCustomAmount(sanitized);
    setActivePreset(null);

    const parsed = parseAmountDollars(sanitized);
    setSelectedAmount(parsed);
    setError(null);
  }, []);

  const handleGiveNow = useCallback(async () => {
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
          frequency: selectedFrequency,
          source: "vital-seed-giving",
        }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (response.status === 401) {
        setError("Sign in at the email gate before giving.");
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
  }, [selectedAmount, selectedFrequency]);

  return (
    <>
      <section
        id="sow-seed"
        className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-brand-black pb-safe"
        aria-label="Vital Seed giving"
      >
        <div className="vital-giving-stage flex flex-1">
          <div
            className="vital-giving-artboard vital-giving-artboard--mobile"
            style={
              mobileArtboardStageStyle({ native: GIVING_MOBILE_ART_NATIVE }) as CSSProperties
            }
          >
            <div className="mobile-artboard-art-fit vital-giving-artboard__art-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={VITAL_SEED_GIVING_ASSETS.mobileBackground}
                alt="Vital Seed giving"
                width={GIVING_MOBILE_ART_NATIVE.width}
                height={GIVING_MOBILE_ART_NATIVE.height}
                className="vital-giving-artboard__img"
                loading="eager"
                decoding="async"
                draggable={false}
              />
              <ExperienceGivingMobileOverlay
                selectedAmount={selectedAmount}
                activePreset={activePreset}
                customAmount={customAmount}
                isLoading={isLoading}
                error={error}
                onSelectAmount={handleSelectAmount}
                onCustomAmountChange={handleCustomAmountChange}
                onCustomAmountFocus={handleCustomAmountFocus}
                onGiveNow={() => void handleGiveNow()}
              />
            </div>
            <MobileArtboardTopChrome
              profile={profile}
              onProfileChange={setProfile}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="flex items-center gap-3 rounded-2xl border border-brand-border bg-brand-panel px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white">
              <Loader2 className="h-5 w-5 animate-spin text-brand-blue" aria-hidden="true" />
              Preparing Checkout
            </div>
          </div>
        ) : null}
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
              className="mx-auto w-full max-w-2xl rounded-3xl border border-brand-pink/50 bg-brand-panel p-8 text-center shadow-[0_0_40px_rgba(255,0,140,0.35)]"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-brand-blue">
                Seed Received
              </p>
              <h2 className="mt-4 font-headline text-xl uppercase tracking-widest text-white">
                Thank You
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-brand-muted">
                Your Vital Seed has been received. Thank you for sowing into this historic moment.
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

export default function ExperienceGivingPageClient({
  initialProfile,
}: ExperienceGivingPageContentProps) {
  return (
    <Suspense fallback={null}>
      <ExperienceGivingPageContent initialProfile={initialProfile} />
    </Suspense>
  );
}
