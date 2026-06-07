"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const PRESET_AMOUNTS = [25, 50, 100, 300] as const;

function parseAmount(value: string): number | null {
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100) / 100;
}

export default function VitalSeedPage() {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const activeAmount = useMemo(() => {
    const custom = parseAmount(customAmount);
    if (custom !== null) return custom;
    return selectedPreset;
  }, [customAmount, selectedPreset]);

  const handlePresetSelect = (amount: number) => {
    setSelectedPreset(amount);
    setCustomAmount("");
    setMessage(null);
  };

  const handleCustomChange = (value: string) => {
    setCustomAmount(value);
    setSelectedPreset(null);
    setMessage(null);
  };

  const handleGive = async () => {
    if (!activeAmount) {
      setMessage("Choose or enter a gift amount to continue.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    // Stripe Checkout Session wiring lands here next.
    await new Promise((resolve) => setTimeout(resolve, 400));

    setMessage(
      `$${activeAmount.toFixed(0)} seed selected — secure checkout connects next.`,
    );
    setIsSubmitting(false);
  };

  return (
    <main className="flex h-screen w-screen items-center justify-center overflow-hidden bg-[#0B090A]">
      <div className="relative flex h-full w-full max-w-[420px] flex-col overflow-hidden bg-black md:max-h-[85vh] md:rounded-[40px] md:border-8 md:border-zinc-800/80 md:shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(224,36,148,0.28),transparent_42%),radial-gradient(circle_at_80%_100%,rgba(0,240,255,0.18),transparent_40%)]" />

        <div className="relative z-10 flex h-full flex-col justify-between p-6 pb-safe">
          <section className="pt-safe text-center">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.45em] text-cyan-300">
              Vital Seed
            </p>
            <h1 className="mt-3 text-2xl font-black uppercase tracking-tight text-white">
              Sow Into The Awakening
            </h1>
            <p className="mx-auto mt-4 max-w-xs text-xs leading-relaxed tracking-[0.12em] text-white/70">
              A NIGHT OF FAITH. A MOVE OF GOD. A GENERATION AWAKENED.
            </p>
          </section>

          <section className="flex flex-1 flex-col justify-center gap-5 px-1">
            <div className="grid grid-cols-2 gap-3">
              {PRESET_AMOUNTS.map((amount) => {
                const isActive =
                  selectedPreset === amount && customAmount.length === 0;

                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handlePresetSelect(amount)}
                    className={`rounded-2xl border px-4 py-4 text-sm font-bold transition ${
                      isActive
                        ? "border-[#E02494] bg-[#E02494]/15 text-white shadow-[0_0_24px_rgba(224,36,148,0.35)]"
                        : "border-zinc-700/80 bg-[#121014] text-white/85 hover:border-[#2464E0]"
                    }`}
                  >
                    ${amount}
                  </button>
                );
              })}
            </div>

            <label className="flex w-full flex-col gap-2">
              <span className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/50">
                Custom amount
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={customAmount}
                onChange={(event) => handleCustomChange(event.target.value)}
                placeholder="$ Enter your seed amount"
                className="w-full rounded-2xl border border-zinc-700/80 bg-[#121014] px-5 py-4 text-center text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#B0267A] focus:ring-1 focus:ring-[#B0267A]"
              />
            </label>

            {message && (
              <p className="text-center text-xs text-[#ff6eb4]" role="status">
                {message}
              </p>
            )}

            <motion.button
              type="button"
              disabled={isSubmitting}
              whileTap={{ scale: 0.98 }}
              onClick={handleGive}
              className="w-full rounded-2xl bg-gradient-to-b from-cyan-400 to-purple-600 px-6 py-5 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_0_35px_rgba(0,220,255,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Preparing..." : "Give Vital Seed 🙌"}
            </motion.button>
          </section>

          <footer className="text-center">
            <Link
              href="/dashboard/live"
              className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80 transition hover:text-cyan-300"
            >
              Back to Live Room
            </Link>
          </footer>
        </div>
      </div>
    </main>
  );
}
