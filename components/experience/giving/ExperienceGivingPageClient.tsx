"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import ExperienceGivingContentOverlay from "@/components/experience/giving/ExperienceGivingContentOverlay";
import { getClientAppUrl } from "@/lib/client-api";
import {
  VITAL_SEED_PAGE_BACKGROUND,
  VITAL_SEED_PAGE_BACKGROUND_MOBILE,
} from "@/lib/data/vital-seed";
import {
  amountToCents,
  parseAmountDollars,
} from "@/lib/vital-seed/custom-amount";
import { VITAL_GIVING_DESKTOP_ART } from "@/lib/experience/giving-layout-slots";

function logGivingLayout(
  hypothesisId: string,
  message: string,
  data: Record<string, number | string>,
) {
  // #region agent log
  fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "baf5b9",
    },
    body: JSON.stringify({
      sessionId: "baf5b9",
      runId: "artboard-fix",
      hypothesisId,
      location: "ExperienceGivingPageClient.tsx",
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

function ExperienceGivingPageContent() {
  const searchParams = useSearchParams();
  const successParam = searchParams.get("success") === "true";
  const [amountRaw, setAmountRaw] = useState("250");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(successParam);
  const artboardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const artboard = artboardRef.current;
    const image = imageRef.current;
    if (!artboard || !image) return;

    const measure = () => {
      const board = artboard.getBoundingClientRect();
      const img = image.getBoundingClientRect();
      const imgAspect = img.width / Math.max(img.height, 1);
      const boardAspect = board.width / Math.max(board.height, 1);
      const expectedAspect = VITAL_GIVING_DESKTOP_ART.width / VITAL_GIVING_DESKTOP_ART.height;

      logGivingLayout("A", "artboard-vs-image-bounds", {
        boardW: Math.round(board.width),
        boardH: Math.round(board.height),
        imgW: Math.round(img.width),
        imgH: Math.round(img.height),
        boardAspect: Number(boardAspect.toFixed(4)),
        imgAspect: Number(imgAspect.toFixed(4)),
        expectedAspect: Number(expectedAspect.toFixed(4)),
        widthDelta: Math.round(Math.abs(board.width - img.width)),
        heightDelta: Math.round(Math.abs(board.height - img.height)),
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(artboard);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!successParam) return;
    window.history.replaceState({}, "", "/experience/giving");
  }, [successParam]);

  const handleQuickAmount = useCallback((value: number | "custom") => {
    setError(null);
    if (value === "custom") {
      setAmountRaw("");
      return;
    }
    setAmountRaw(String(value));
  }, []);

  const handleGive = useCallback(async () => {
    const dollars = parseAmountDollars(amountRaw);

    if (dollars == null) {
      setError("Enter a valid giving amount.");
      return;
    }

    const amountInCents = amountToCents(dollars);

    if (amountInCents < 50) {
      setError("Minimum gift is $0.50.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${getClientAppUrl()}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amountInCents }),
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
      setIsSubmitting(false);
    }
  }, [amountRaw]);

  return (
    <main className="relative h-dvh min-h-dvh w-full overflow-hidden bg-brand-black">
      <div className="vital-giving-stage">
        {/* Mobile — background only */}
        <picture aria-hidden className="vital-giving-stage__mobile md:hidden">
          <source
            media="(max-width: 767px) and (orientation: portrait)"
            srcSet={VITAL_SEED_PAGE_BACKGROUND_MOBILE}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={VITAL_SEED_PAGE_BACKGROUND_MOBILE}
            alt=""
            className="h-full w-full object-contain object-center"
          />
        </picture>

        {/* Desktop — single artboard wrapper matches rendered image */}
        <div ref={artboardRef} className="vital-giving-artboard hidden md:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={VITAL_SEED_PAGE_BACKGROUND}
            alt=""
            className="vital-giving-artboard__img"
          />
          <ExperienceGivingContentOverlay
            amountRaw={amountRaw}
            onAmountChange={setAmountRaw}
            onQuickAmount={handleQuickAmount}
            onSubmit={() => void handleGive()}
            isSubmitting={isSubmitting}
            error={error}
          />
        </div>
      </div>

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
    </main>
  );
}

export default function ExperienceGivingPageClient() {
  return (
    <Suspense fallback={null}>
      <ExperienceGivingPageContent />
    </Suspense>
  );
}
