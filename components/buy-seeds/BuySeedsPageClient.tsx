"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import BuySeedsOverlay from "@/components/buy-seeds/BuySeedsOverlay";
import { getMerchProduct } from "@/lib/merch/catalog";
import { BUY_SEEDS_ASSETS, BUY_SEEDS_MOBILE_ART } from "@/lib/seeds/assets";
import {
  BUY_SEEDS_DEFAULT_PACKAGE_ID,
  getBuySeedsPackage,
} from "@/lib/seeds/buy-seeds-slots";
import { mobileArtboardStageStyle } from "@/lib/responsive";
import { useMerchCheckout } from "@/lib/useMerchCheckout";

export default function BuySeedsPageClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const successParam = searchParams.get("success") === "true";

  const [selectedPackageId, setSelectedPackageId] = useState(BUY_SEEDS_DEFAULT_PACKAGE_ID);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(successParam);

  const { isSubmitting, errorMessage, startCheckout, clearError } = useMerchCheckout();

  useEffect(() => {
    if (!successParam) return;
    window.history.replaceState({}, "", pathname);
  }, [successParam, pathname]);

  const handleBuyPack = useCallback(
    async (productId: string) => {
      const product = getMerchProduct(productId);
      if (!product) return;

      clearError();
      setActiveProductId(productId);
      await startCheckout({ product, selectedSize: "" });
      setActiveProductId(null);
    },
    [clearError, startCheckout],
  );

  const handleSelectPackage = useCallback(
    (packageId: string) => {
      setSelectedPackageId(packageId);
      clearError();
    },
    [clearError],
  );

  const handleContinue = useCallback(() => {
    const selectedPackage = getBuySeedsPackage(selectedPackageId);
    if (!selectedPackage) return;
    void handleBuyPack(selectedPackage.productId);
  }, [handleBuyPack, selectedPackageId]);

  return (
    <>
      <div className="buy-seeds-page">
        <div
          className="buy-seeds-page__stage"
          style={mobileArtboardStageStyle() as CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BUY_SEEDS_ASSETS.mobileBackground}
            alt="Buy Vital Seeds — coin packs for live concert emotes"
            width={BUY_SEEDS_MOBILE_ART.width}
            height={BUY_SEEDS_MOBILE_ART.height}
            className="buy-seeds-page__bg"
            loading="eager"
            decoding="async"
            draggable={false}
          />
          <BuySeedsOverlay
            selectedPackageId={selectedPackageId}
            isSubmitting={isSubmitting}
            activeProductId={activeProductId}
            errorMessage={errorMessage}
            onSelectPackage={handleSelectPackage}
            onContinue={handleContinue}
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
              className="mx-auto w-full max-w-2xl rounded-3xl border border-brand-blue/50 bg-brand-panel p-8 text-center shadow-[0_0_40px_rgba(0,168,255,0.35)]"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-brand-blue">
                Seeds Credited
              </p>
              <h2 className="mt-4 font-headline text-xl uppercase tracking-widest text-white">
                Thank You
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-brand-muted">
                Your Vital Seeds are ready for the live room. Shower the stage when the concert goes
                live.
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
