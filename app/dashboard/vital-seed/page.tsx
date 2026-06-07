"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const PRESET_AMOUNTS = ["25", "50", "100"] as const;

const GIVING_OPTIONS = [
  { id: "25", label: "$25 Frequency Seed" },
  { id: "50", label: "$50 Blessing Tone" },
  { id: "100", label: "$100 Breakthrough Wave" },
  { id: "custom", label: "Custom Frequency Value" },
] as const;

function sanitizeAmountInput(value: string): string {
  return value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
}

function resolveAmountDollars(amount: string, customValue: string): number | null {
  if (PRESET_AMOUNTS.includes(amount as (typeof PRESET_AMOUNTS)[number])) {
    return Number(amount);
  }

  const raw = amount === "custom" ? customValue : amount;
  const parsed = Number.parseFloat(raw);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function VitalSeedGiving() {
  const searchParams = useSearchParams();
  const successParam = searchParams.get("success") === "true";
  const [amount, setAmount] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(successParam);

  const showCustomInput =
    amount === "custom" ||
    (amount !== "" && !PRESET_AMOUNTS.includes(amount as (typeof PRESET_AMOUNTS)[number]));

  const activeDollars = resolveAmountDollars(amount, customValue);

  useEffect(() => {
    if (!successParam) return;
    window.history.replaceState({}, "", "/dashboard/vital-seed");
  }, [successParam]);

  const handlePresetSelect = useCallback((presetId: string) => {
    setAmount(presetId);
    setCustomValue("");
  }, []);

  const handleCustomButtonSelect = useCallback(() => {
    setAmount("custom");
  }, []);

  const handleCustomInputChange = useCallback(
    (value: string) => {
      const sanitized = sanitizeAmountInput(value);
      setCustomValue(sanitized);

      if (sanitized) {
        setAmount(sanitized);
      } else {
        setAmount("custom");
      }
    },
    [],
  );

  const handleTransmit = useCallback(async () => {
    const customerEmail = localStorage.getItem("awakening_user_email");

    if (!customerEmail) {
      window.alert(
        "We need your email on file before transmitting a seed. Please complete the email gate first.",
      );
      return;
    }

    const dollars = resolveAmountDollars(amount, customValue);

    if (!dollars) {
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amountInCents, customerEmail }),
        },
      );

      const data = (await response.json()) as { url?: string; error?: string };

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
  }, [amount, customValue]);

  return (
    <main className="min-h-screen w-full bg-[#0B090A] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-between p-6 pb-24">
        <section className="flex flex-col items-center">
          <div className="w-full rounded-3xl border border-[#1E40AF]/30 bg-[#111111]/80 p-6 shadow-[0_0_40px_rgba(176,38,122,0.15)]">
            <h1 className="text-center text-lg font-bold uppercase tracking-[0.35em] text-white">
              Vital Sound Giving
            </h1>

            <p className="mt-4 bg-gradient-to-r from-[#1E40AF] to-[#B0267A] bg-clip-text text-center text-xs font-bold uppercase tracking-[0.28em] text-transparent">
              Every Gift Has A Frequency.
            </p>

            <div
              aria-hidden="true"
              className="mx-auto mt-5 flex h-10 w-full max-w-[280px] items-end justify-center gap-1 rounded-xl border border-[#B0267A]/70 px-3 py-2 shadow-[0_0_18px_rgba(176,38,122,0.45)]"
            >
              {[3, 6, 4, 8, 5, 9, 4, 7, 3, 6, 8, 4].map((height, index) => (
                <span
                  key={index}
                  className="w-1 rounded-full bg-gradient-to-t from-[#B0267A] to-[#1E40AF]"
                  style={{ height: `${height * 3}px` }}
                />
              ))}
            </div>
          </div>

          <article className="mt-6 w-full rounded-2xl border border-[#B0267A]/40 bg-[#111111]/90 p-5 shadow-[0_0_30px_rgba(176,38,122,0.25)]">
            <p className="text-sm leading-relaxed text-zinc-400">
              Where the power of sound meets the journey of healing. Sow into Ian
              Craig&apos;s lifetime musical sound legacy since age 9 and directly
              champion his 30-year physical battle of resilience and healing on
              dialysis.
            </p>
          </article>

          <div className="mt-8 grid w-full grid-cols-2 gap-3">
            {GIVING_OPTIONS.map((option) => {
              const isPreset = PRESET_AMOUNTS.includes(
                option.id as (typeof PRESET_AMOUNTS)[number],
              );
              const isActive = isPreset
                ? amount === option.id
                : amount === "custom" ||
                  (amount !== "" &&
                    !PRESET_AMOUNTS.includes(amount as (typeof PRESET_AMOUNTS)[number]));

              return (
                <motion.button
                  key={option.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() =>
                    isPreset
                      ? handlePresetSelect(option.id)
                      : handleCustomButtonSelect()
                  }
                  className={`rounded-2xl border px-3 py-4 text-left text-xs font-bold uppercase leading-snug transition ${
                    isActive
                      ? "border-[#B0267A] bg-[#B0267A]/10 text-white shadow-[0_0_22px_rgba(176,38,122,0.55)]"
                      : "border-white/15 bg-[#111111] text-white/80 hover:border-[#1E40AF]/60"
                  }`}
                >
                  {option.label}
                </motion.button>
              );
            })}
          </div>

          {showCustomInput && (
            <label className="mt-4 w-full">
              <span className="mb-2 block text-center text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-[#1E40AF]/80">
                Enter custom amount
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={customValue}
                onChange={(event) => handleCustomInputChange(event.target.value)}
                placeholder="$0.00"
                className="w-full rounded-2xl border border-white/15 bg-[#111111] px-4 py-3 text-center text-sm text-white outline-none focus:border-[#B0267A] focus:ring-1 focus:ring-[#B0267A]"
              />
            </label>
          )}
        </section>

        <footer className="sticky bottom-0 w-full pt-6 pb-safe">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
            onClick={handleTransmit}
            disabled={!activeDollars || isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-[#1E40AF] to-[#B0267A] px-6 py-5 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_35px_rgba(176,38,122,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Preparing Checkout..." : "Transmit My Seed Now 🎵"}
          </motion.button>
        </footer>
      </div>

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
              className="w-full max-w-md rounded-3xl border border-[#B0267A]/50 bg-[#111111] p-8 text-center shadow-[0_0_40px_rgba(176,38,122,0.35)]"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#1E40AF]">
                Transmission Complete
              </p>
              <h2 className="mt-4 text-xl font-bold uppercase tracking-widest text-white">
                Thank You
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                Your Vital Seed has been successfully transmitted to Ian&apos;s
                journey! Thank you for backing the movement.
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
    </main>
  );
}

export default function VitalSeedPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#0B090A] text-zinc-400">
          Loading Vital Seed...
        </main>
      }
    >
      <VitalSeedGiving />
    </Suspense>
  );
}
