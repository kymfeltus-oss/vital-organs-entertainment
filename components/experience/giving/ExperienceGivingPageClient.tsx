"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import VitalSeedGivingPage from "@/components/vital-seed/giving/VitalSeedGivingPage";

function ExperienceGivingPageContent() {
  const searchParams = useSearchParams();
  const successParam = searchParams.get("success") === "true";
  const [showThankYou, setShowThankYou] = useState(successParam);

  useEffect(() => {
    if (!successParam) return;
    window.history.replaceState({}, "", "/experience/giving");
  }, [successParam]);

  return (
    <>
      <VitalSeedGivingPage />

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
              className="glass-panel mx-auto w-full max-w-md rounded-3xl border border-brand-border p-8 text-center"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="font-ui text-xs font-bold uppercase tracking-[0.35em] text-brand-blue">
                Seed Received
              </p>
              <h2 className="font-headline mt-4 text-2xl uppercase tracking-widest text-white">
                Thank You
              </h2>
              <p className="font-body mt-4 text-sm leading-relaxed text-brand-muted">
                Your Vital Seed has been received. Thank you for sowing into this
                historic moment.
              </p>
              <button
                type="button"
                onClick={() => setShowThankYou(false)}
                className="touch-target mt-8 w-full rounded-2xl border border-brand-blue/40 bg-brand-blue/10 px-6 py-4 font-ui text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-brand-blue/20"
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
