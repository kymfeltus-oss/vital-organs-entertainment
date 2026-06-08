"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useCallback, useState } from "react";
import {
  formatMerchPrice,
  SEED_ECONOMY_PACKS,
  type SeedEconomyPack,
} from "@/lib/merch/catalog";
import { getAppUrl } from "@/lib/useLiveEmoteFanout";

type SeedPackUpsellModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SeedPackUpsellModal({
  isOpen,
  onClose,
}: SeedPackUpsellModalProps) {
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePurchase = useCallback(async (pack: SeedEconomyPack) => {
    setSubmittingId(pack.productId);
    setErrorMessage(null);

    try {
      const response = await fetch(`${getAppUrl()}/api/checkout/merch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: pack.productId,
          selectedSize: "N/A",
        }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (response.status === 401) {
        setErrorMessage("Sign in at the email gate before purchasing seeds.");
        return;
      }

      if (!response.ok || !data.url) {
        setErrorMessage(data.error ?? "Unable to start checkout. Please try again.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setErrorMessage("Unable to reach checkout. Please try again.");
    } finally {
      setSubmittingId(null);
    }
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close seed pack offer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="seed-upsell-title"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.96 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[90dvh] w-full -translate-y-1/2 overflow-y-auto rounded-3xl border border-[#1E40AF]/45 bg-[#111111]/95 p-6 shadow-[0_0_60px_rgba(30,64,175,0.35)] backdrop-blur-xl md:inset-x-8 lg:inset-x-16 xl:inset-x-24"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.28em] text-[#1E40AF]">
                  Golden Harvest Upsell
                </p>
                <h2
                  id="seed-upsell-title"
                  className="mt-2 text-base font-bold uppercase tracking-widest text-white md:text-lg"
                >
                  Refill Your Seed Wallet
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="touch-target rounded-full border border-white/15 p-2 text-zinc-400 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-zinc-300">
              🌱 You&apos;re out of basic seeds! Want to shower the stage with a
              Golden Harvest? Unlock premium animated emotes and support the
              concert by grabbing a Seed Pack right now!
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {SEED_ECONOMY_PACKS.map((pack) => {
                const isSubmitting = submittingId === pack.productId;

                return (
                  <motion.button
                    key={pack.productId}
                    type="button"
                    whileTap={isSubmitting ? undefined : { scale: 0.98 }}
                    onClick={() => void handlePurchase(pack)}
                    disabled={Boolean(submittingId)}
                    className="touch-target flex flex-col rounded-2xl border border-white/10 bg-[#0B090A]/90 p-4 text-left transition hover:border-[#1E40AF]/60 hover:shadow-[0_0_24px_rgba(30,64,175,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pack.badge && (
                      <span className="text-[0.55rem] font-bold uppercase tracking-[0.18em] text-[#B0267A]">
                        {pack.badge}
                      </span>
                    )}
                    <span className="mt-1 text-sm font-bold uppercase tracking-widest text-white">
                      {pack.title}
                    </span>
                    <span className="mt-2 text-xs text-zinc-400">{pack.description}</span>
                    <span className="mt-3 text-lg font-bold text-[#1E40AF]">
                      🌱 {pack.seedAmount.toLocaleString("en-US")} Seeds
                    </span>
                    <span className="mt-1 text-sm font-bold text-white">
                      {formatMerchPrice(pack.price)}
                    </span>
                    {isSubmitting && (
                      <span className="mt-3 inline-flex items-center gap-2 text-xs text-zinc-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Preparing Checkout...
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {errorMessage && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-[#B0267A]/40 bg-[#B0267A]/10 px-4 py-3 text-center text-sm text-zinc-200"
              >
                {errorMessage}
              </p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
