"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

function ExperienceGivingPageContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const successParam = searchParams.get("success") === "true";
  const [showThankYou, setShowThankYou] = useState(successParam);

  useEffect(() => {
    if (!successParam) return;
    window.history.replaceState({}, "", pathname);
  }, [successParam, pathname]);

  return (
    <>
      <section
        id="sow-seed"
        className="relative flex min-h-dvh w-full flex-col bg-brand-black pt-safe pb-safe"
        aria-label="Vital Seed giving"
      />

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

export default function ExperienceGivingPageClient() {
  return (
    <Suspense fallback={null}>
      <ExperienceGivingPageContent />
    </Suspense>
  );
}
