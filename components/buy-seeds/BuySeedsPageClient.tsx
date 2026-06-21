"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import BuySeedsOverlay from "@/components/buy-seeds/BuySeedsOverlay";
import MobileArtboardTabHeader from "@/components/navigation/MobileArtboardTabHeader";
import { getMerchProduct } from "@/lib/merch/catalog";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import {
  BUY_SEEDS_ASSETS,
  BUY_SEEDS_DEFAULT_PACKAGE_ID,
  BUY_SEEDS_MOBILE_ART_NATIVE,
  getSeedPackage,
  type SeedPackageId,
} from "@/lib/seeds/assets";
import {
  MOBILE_ARTBOARD_ART_FIT,
  MOBILE_ARTBOARD_TAB_SHELL,
  MOBILE_ARTBOARD_TAB_STAGE,
  mobileArtboardStageStyle,
} from "@/lib/responsive";
import { useMerchCheckout } from "@/lib/useMerchCheckout";

type BuySeedsPageClientProps = {
  initialProfile: AttendeeProfileSnapshot;
};

export default function BuySeedsPageClient({ initialProfile }: BuySeedsPageClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const successParam = searchParams.get("success") === "true";

  const [selectedPackageId, setSelectedPackageId] =
    useState<SeedPackageId>(BUY_SEEDS_DEFAULT_PACKAGE_ID);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(successParam);
  const [profile, setProfile] = useState(initialProfile);

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
    (packageId: SeedPackageId) => {
      setSelectedPackageId(packageId);
      clearError();
    },
    [clearError],
  );

  const handleContinue = useCallback(() => {
    const selectedPackage = getSeedPackage(selectedPackageId);
    if (!selectedPackage) return;
    void handleBuyPack(selectedPackage.productId);
  }, [handleBuyPack, selectedPackageId]);

  return (
    <>
      <div className={`buy-seeds-page ${MOBILE_ARTBOARD_TAB_SHELL} relative overflow-hidden bg-brand-black`}>
        <div
          className={`buy-seeds-page__stage ${MOBILE_ARTBOARD_TAB_STAGE} relative mx-auto w-full`}
          style={
            mobileArtboardStageStyle({ native: BUY_SEEDS_MOBILE_ART_NATIVE }) as CSSProperties
          }
        >
          <div className={`${MOBILE_ARTBOARD_ART_FIT} buy-seeds-page__art-fit`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BUY_SEEDS_ASSETS.mobileBackground}
              alt=""
              width={BUY_SEEDS_MOBILE_ART_NATIVE.width}
              height={BUY_SEEDS_MOBILE_ART_NATIVE.height}
              className="buy-seeds-page__bg"
              loading="eager"
              decoding="async"
              draggable={false}
            />

            <MobileArtboardTabHeader profile={profile} onProfileChange={setProfile} />

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
