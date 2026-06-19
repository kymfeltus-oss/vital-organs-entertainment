"use client";

import {
  Suspense,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import ExperienceGivingArtboard from "@/components/experience/giving/ExperienceGivingArtboard";
import ExperienceGivingHotspots from "@/components/experience/giving/ExperienceGivingHotspots";
import VitalSeedOverlay from "@/components/vital-seed/VitalSeedOverlay";
import { getClientAppUrl } from "@/lib/client-api";
import {
  EXPERIENCE_GIVING_MOBILE_ART,
} from "@/lib/experience/giving-hotspots";
import {
  appendKeypadKey,
  formatKeypadAmountDisplay,
  parseAmountDollars,
  type KeypadKey,
} from "@/lib/vital-seed/custom-amount";
import {
  VITAL_SEED_GIVING_ASSETS,
  VITAL_SEED_GIVING_DESKTOP_ART,
} from "@/lib/vital-seed/giving-assets";

function ExperienceGivingPageContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const successParam = searchParams.get("success") === "true";
  const mobileArtboardRef = useRef<HTMLDivElement>(null);

  const [amountRaw, setAmountRaw] = useState("250");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(successParam);
  const amountDisplay = useMemo(
    () => formatKeypadAmountDisplay(amountRaw),
    [amountRaw],
  );

  useEffect(() => {
    if (!successParam) return;
    window.history.replaceState({}, "", pathname);
  }, [successParam, pathname]);

  useEffect(() => {
    const artboard = mobileArtboardRef.current;
    if (!artboard) return;

    const logLayout = (trigger: string) => {
      const rect = artboard.getBoundingClientRect();
      const img = artboard.querySelector("img");
      const imgRect = img?.getBoundingClientRect();
      // #region agent log
      fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "baf5b9",
        },
        body: JSON.stringify({
          sessionId: "baf5b9",
          runId: "giving-layout",
          hypothesisId: "B-E",
          location: "ExperienceGivingPageClient.tsx:logLayout",
          message: "Mobile giving artboard layout",
          data: {
            trigger,
            artboardW: Math.round(rect.width),
            artboardH: Math.round(rect.height),
            imgW: imgRect ? Math.round(imgRect.width) : null,
            imgH: imgRect ? Math.round(imgRect.height) : null,
            viewportW: window.innerWidth,
            viewportH: window.innerHeight,
            artNativeW: EXPERIENCE_GIVING_MOBILE_ART.width,
            artNativeH: EXPERIENCE_GIVING_MOBILE_ART.height,
            bgSrc: VITAL_SEED_GIVING_ASSETS.mobileBackground,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    };

    logLayout("mount");

    const resizeObserver = new ResizeObserver(() => logLayout("resize"));
    resizeObserver.observe(artboard);
    window.addEventListener("orientationchange", () => logLayout("orientation"));

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("orientationchange", () => logLayout("orientation"));
    };
  }, []);

  const handleQuickAmount = useCallback((value: number | "custom") => {
    // #region agent log
    fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "baf5b9",
      },
      body: JSON.stringify({
        sessionId: "baf5b9",
        runId: "giving-layout",
        hypothesisId: "C-D",
        location: "ExperienceGivingPageClient.tsx:handleQuickAmount",
        message: "Quick give hotspot activated",
        data: { value },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (value === "custom") {
      setAmountRaw("");
      return;
    }

    setAmountRaw(String(value));
  }, []);

  const handleKeypad = useCallback((value: string) => {
    // #region agent log
    fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "baf5b9",
      },
      body: JSON.stringify({
        sessionId: "baf5b9",
        runId: "giving-layout",
        hypothesisId: "C-D",
        location: "ExperienceGivingPageClient.tsx:handleKeypad",
        message: "Keypad hotspot activated",
        data: { value, amountBefore: amountRaw },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    setAmountRaw((current) =>
      appendKeypadKey(current, value as KeypadKey),
    );
  }, [amountRaw]);

  const handleGive = useCallback(async () => {
    const dollars = parseAmountDollars(amountRaw);

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
  }, [amountRaw]);

  const overlayProps = {
    amountDisplay,
    amountRaw,
    onAmountChange: setAmountRaw,
    onQuickAmount: handleQuickAmount,
    onSowSeed: () => void handleGive(),
  };

  return (
    <>
      <section
        id="sow-seed"
        className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-brand-black pt-safe pb-safe"
        aria-label="Vital Seed giving"
      >
        <ExperienceGivingArtboard
          artWidth={VITAL_SEED_GIVING_DESKTOP_ART.width}
          artHeight={VITAL_SEED_GIVING_DESKTOP_ART.height}
          backgroundSrc={VITAL_SEED_GIVING_ASSETS.desktopBackground}
          visibleClassName="hidden flex-1 lg:flex"
          scaleMode="cover"
        >
          <VitalSeedOverlay {...overlayProps} />
        </ExperienceGivingArtboard>

        <div className="vital-giving-stage flex flex-1 lg:hidden">
          <div
            ref={mobileArtboardRef}
            className="vital-giving-artboard vital-giving-artboard--mobile"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={VITAL_SEED_GIVING_ASSETS.mobileBackground}
              alt="Vital Seed giving"
              width={EXPERIENCE_GIVING_MOBILE_ART.width}
              height={EXPERIENCE_GIVING_MOBILE_ART.height}
              className="vital-giving-artboard__img"
              loading="eager"
              decoding="async"
              draggable={false}
            />
            <ExperienceGivingHotspots
              variant="mobile"
              onQuickAmount={handleQuickAmount}
              onKeypad={handleKeypad}
              onSowSeed={() => void handleGive()}
            />
          </div>
        </div>

        {isSubmitting ? (
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

export default function ExperienceGivingPageClient() {
  return (
    <Suspense fallback={null}>
      <ExperienceGivingPageContent />
    </Suspense>
  );
}
