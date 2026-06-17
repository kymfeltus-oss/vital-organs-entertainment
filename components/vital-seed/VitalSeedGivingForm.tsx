"use client";

import Image from "next/image";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import VitalSeedMobileOverlay from "@/components/vital-seed/VitalSeedMobileOverlay";
import VitalSeedOverlay from "@/components/vital-seed/VitalSeedOverlay";
import { getClientAppUrl } from "@/lib/client-api";
import {
  formatKeypadAmountDisplay,
  parseAmountDollars,
} from "@/lib/vital-seed/custom-amount";
import {
  VITAL_SEED_GIVING_ASSETS,
  VITAL_SEED_GIVING_DESKTOP_ART,
  VITAL_SEED_GIVING_MOBILE_ART,
} from "@/lib/vital-seed/giving-assets";

const MOBILE_ART = {
  width: VITAL_SEED_GIVING_MOBILE_ART.width,
  height: VITAL_SEED_GIVING_MOBILE_ART.height,
} as const;

type ScaledGivingArtboardProps = {
  artWidth: number;
  artHeight: number;
  backgroundSrc: string;
  visibleClassName: string;
  scaleMode?: "contain" | "cover";
  imageClassName?: string;
  children: ReactNode;
};

function ScaledGivingArtboard({
  artWidth,
  artHeight,
  backgroundSrc,
  visibleClassName,
  scaleMode = "contain",
  imageClassName = "z-0 h-full w-full object-cover",
  children,
}: ScaledGivingArtboardProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const updateScale = () => {
      const { width: hostWidth, height: hostHeight } = host.getBoundingClientRect();
      if (!hostWidth || !hostHeight) return;

      const widthScale = hostWidth / artWidth;
      const heightScale = hostHeight / artHeight;
      setScale(scaleMode === "cover" ? Math.max(widthScale, heightScale) : Math.min(widthScale, heightScale));
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(host);
    window.addEventListener("orientationchange", updateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("orientationchange", updateScale);
    };
  }, [artWidth, artHeight, scaleMode]);

  return (
    <div
      ref={hostRef}
      className={`relative flex w-full flex-1 items-center justify-center overflow-hidden ${visibleClassName}`}
    >
      <div
        className="relative shrink-0 origin-center"
        style={{
          width: artWidth,
          height: artHeight,
          transform: `scale(${scale})`,
        }}
      >
        <Image
          src={backgroundSrc}
          alt=""
          width={artWidth}
          height={artHeight}
          priority
          sizes="100vw"
          className={imageClassName}
        />
        <div className="absolute inset-0 z-10 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

function VitalSeedGivingFormContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const successParam = searchParams.get("success") === "true";

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

  const handleQuickAmount = useCallback((value: number | "custom") => {
    if (value === "custom") {
      setAmountRaw("");
      return;
    }

    setAmountRaw(String(value));
  }, []);

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
        className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-[#02030A] pt-safe pb-safe"
      >
        <ScaledGivingArtboard
          artWidth={VITAL_SEED_GIVING_DESKTOP_ART.width}
          artHeight={VITAL_SEED_GIVING_DESKTOP_ART.height}
          backgroundSrc={VITAL_SEED_GIVING_ASSETS.desktopBackground}
          visibleClassName="hidden flex-1 lg:flex"
          scaleMode="cover"
        >
          <VitalSeedOverlay {...overlayProps} />
        </ScaledGivingArtboard>

        <ScaledGivingArtboard
          artWidth={MOBILE_ART.width}
          artHeight={MOBILE_ART.height}
          backgroundSrc={VITAL_SEED_GIVING_ASSETS.mobileBackground}
          visibleClassName="flex flex-1 lg:hidden"
        >
          <VitalSeedMobileOverlay {...overlayProps} />
        </ScaledGivingArtboard>

        {isSubmitting && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-black/80 px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Preparing Checkout
            </div>
          </div>
        )}
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
              className="mx-auto w-full max-w-2xl rounded-3xl border border-[#FF2EA6]/50 bg-[#111111] p-8 text-center shadow-[0_0_40px_rgba(255,46,166,0.35)]"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#00C8FF]">
                Seed Received
              </p>
              <h2 className="mt-4 text-xl font-bold uppercase tracking-widest text-white">
                Thank You
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                Your Vital Seed has been received. Thank you for sowing into this historic moment.
              </p>
              <button
                type="button"
                onClick={() => setShowThankYou(false)}
                className="mt-8 w-full rounded-2xl border border-[#00C8FF] bg-[#00C8FF]/10 px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#00C8FF]/20"
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
