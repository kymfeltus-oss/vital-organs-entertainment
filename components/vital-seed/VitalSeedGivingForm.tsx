"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { HandHeart, Heart, Loader2 } from "lucide-react";
import { getClientAppUrl } from "@/lib/client-api";

const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000] as const;

function sanitizeAmountInput(value: string): string {
  return value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
}

function VitalSeedGivingFormContent() {
  const searchParams = useSearchParams();
  const successParam = searchParams.get("success") === "true";
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [customValue, setCustomValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(successParam);

  useEffect(() => {
    if (!successParam) return;
    window.history.replaceState({}, "", "/dashboard/vital-seed");
  }, [successParam]);

  const activeDollars = customValue
    ? Number.parseFloat(customValue)
    : selectedAmount;

  const handleGive = useCallback(async () => {
    const dollars = activeDollars;

    if (!dollars || !Number.isFinite(dollars) || dollars <= 0) {
      window.alert("Please select or enter a valid giving amount.");
      return;
    }

    const amountInCents = Math.round(dollars * 100);

    if (amountInCents < 50) {
      window.alert("Minimum transaction value not met.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${getClientAppUrl()}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amountInCents }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (response.status === 401) {
        window.alert("Sign in at the email gate before giving.");
        return;
      }

      if (!response.ok || !data.url) {
        window.alert(data.error ?? "Unable to start checkout. Please try again.");
        return;
      }

      window.location.href = data.url;
    } catch {
      window.alert("Unable to reach checkout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [activeDollars]);

  return (
    <>
      <section
        id="sow-seed"
        className="rounded-2xl border border-[#1E40AF]/30 bg-[#111111]/80 p-4 md:p-6"
      >
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-[#1E40AF]">
          Vital Seed Giving
        </p>
        <div className="mt-4 flex items-center justify-center">
          <Heart className="h-10 w-10 text-[#B0267A]" strokeWidth={1.2} />
        </div>

        <p className="mt-4 text-center text-[0.6rem] font-bold uppercase tracking-[0.22em] text-zinc-400">
          Choose Your Seed
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {PRESET_AMOUNTS.map((amount) => {
            const isActive = selectedAmount === amount && !customValue;
            return (
              <motion.button
                key={amount}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomValue("");
                }}
                className={`rounded-xl border px-2 py-4 text-sm font-bold transition ${
                  isActive
                    ? "border-[#B0267A] bg-[#B0267A]/10 text-white shadow-[0_0_22px_rgba(176,38,122,0.55)]"
                    : "border-white/15 bg-[#0B090A] text-white/80 hover:border-[#1E40AF]/50"
                }`}
              >
                ${amount}
              </motion.button>
            );
          })}
        </div>

        <label className="mt-5 block">
          <span className="sr-only">Custom amount</span>
          <input
            type="text"
            inputMode="decimal"
            value={customValue}
            onChange={(event) => {
              const sanitized = sanitizeAmountInput(event.target.value);
              setCustomValue(sanitized);
              if (sanitized) setSelectedAmount(null);
            }}
            placeholder="$ Enter Amount"
            className="w-full rounded-xl border border-white/15 bg-[#0B090A] px-4 py-4 text-center text-sm text-white outline-none transition focus:border-[#B0267A] focus:ring-1 focus:ring-[#B0267A]"
          />
        </label>

        <motion.button
          type="button"
          whileTap={isSubmitting ? undefined : { scale: 0.98 }}
          onClick={() => void handleGive()}
          disabled={!activeDollars || isSubmitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1E40AF] to-[#B0267A] px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_35px_rgba(176,38,122,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Preparing Checkout...</span>
            </>
          ) : (
            "Give Now"
          )}
        </motion.button>

        <article className="mt-6 rounded-xl border border-white/10 bg-[#0B090A]/80 p-4">
          <div className="flex items-start gap-3">
            <HandHeart className="mt-0.5 h-5 w-5 shrink-0 text-[#1E40AF]" strokeWidth={1.5} />
            <p className="text-xs leading-relaxed text-zinc-400">
              Your Vital Seed fuels the 300 Awakening live recording experience and
              supports the movement behind the music.
            </p>
          </div>
        </article>
      </section>

      <AnimatePresence>
        {showThankYou && (
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
              className="mx-auto w-full max-w-2xl rounded-3xl border border-[#B0267A]/50 bg-[#111111] p-8 text-center shadow-[0_0_40px_rgba(176,38,122,0.35)]"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#1E40AF]">
                Seed Received
              </p>
              <h2 className="mt-4 text-xl font-bold uppercase tracking-widest text-white">
                Thank You
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                Your Vital Seed has been received. Thank you for sowing into this
                historic moment.
              </p>
              <button
                type="button"
                onClick={() => setShowThankYou(false)}
                className="mt-8 w-full rounded-2xl border border-[#1E40AF] bg-[#1E40AF]/10 px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#1E40AF]/20"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function VitalSeedGivingForm() {
  return (
    <Suspense fallback={null}>
      <VitalSeedGivingFormContent />
    </Suspense>
  );
}
